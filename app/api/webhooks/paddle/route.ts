import { prisma } from '@/lib/prisma/server'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Verify Paddle webhook signature
function verifyPaddleSignature(body: string, signature: string): boolean {
  const publicKey = process.env.PADDLE_PUBLIC_KEY
  if (!publicKey) {
    console.error('PADDLE_PUBLIC_KEY not configured')
    return false
  }

  try {
    // Paddle uses p_signature header with Base64 encoded signature
    const signatureBuffer = Buffer.from(signature, 'base64')
    const verifier = crypto.createVerify('RSA-SHA256')
    verifier.update(body)
    return verifier.verify(publicKey, signatureBuffer)
  } catch (error) {
    console.error('Error verifying Paddle signature:', error)
    return false
  }
}

function mapPaddleStatus(status: string): 'active' | 'canceled' | 'past_due' | 'paused' | 'trialing' {
  switch (status.toLowerCase()) {
    case 'active':
      return 'active'
    case 'canceled':
    case 'cancelled':
      return 'canceled'
    case 'past_due':
      return 'past_due'
    case 'paused':
      return 'paused'
    case 'trialing':
      return 'trialing'
    default:
      return 'active'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('p-signature') || ''
    const paddleEventType = request.headers.get('p-event-type') || ''

    // Verify webhook signature
    if (!verifyPaddleSignature(body, signature)) {
      console.error('Invalid Paddle webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)

    // Handle subscription events
    if (paddleEventType.includes('subscription')) {
      const subscription = data.data
      const paddleSubscriptionId = subscription.id?.toString()
      const customerId = subscription.customer_id?.toString()

      if (!paddleSubscriptionId || !customerId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Find user by customer_id stored in metadata or by email
      // Paddle webhooks include customer.email in the subscription data
      const customerEmail = subscription.customer?.emailFact || subscription.items?.[0]?.price?.product?.name
      
      // Try to find profile by email or customer_id metadata
      // Note: In production, you may want to store paddle_customer_id in Profile model
      let profile = null
      if (customerEmail) {
        // Find by matching email in auth.users via Supabase Admin API or store email in profile
        // For now, we'll need to query by a custom field or use a different lookup method
        profile = await prisma.profile.findFirst({
          where: {
            // This is a placeholder - you may need to join with auth.users or store email in profile
            // For MVP, you could query Supabase auth.users via admin API
          },
        })
      }

      // Fallback: If profile not found and it's a creation event, we may need to create it
      // This should ideally be handled during checkout when user is authenticated
      if (!profile && paddleEventType === 'subscription.created') {
        // If user doesn't exist yet, the subscription creation will fail
        // This should be handled during checkout flow
        console.error('User not found for Paddle customer:', customerId)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const status = mapPaddleStatus(subscription.status)
      const currentPeriodStart = subscription.current_billing_period?.starts_at
        ? new Date(subscription.current_billing_period.starts_at)
        : new Date()
      const currentPeriodEnd = subscription.current_billing_period?.ends_at
        ? new Date(subscription.current_billing_period.ends_at)
        : new Date()

      switch (paddleEventType) {
        case 'subscription.created':
          await prisma.subscription.upsert({
            where: { paddleSubscriptionId },
            update: {
              status,
              currentPeriodStart,
              currentPeriodEnd,
              updatedAt: new Date(),
            },
            create: {
              userId: profile!.id,
              paddleSubscriptionId,
              paddlePlanId: subscription.plan_id?.toString() || '',
              status,
              currentPeriodStart,
              currentPeriodEnd,
            },
          })
          break

        case 'subscription.updated':
          await prisma.subscription.updateMany({
            where: { paddleSubscriptionId },
            data: {
              status,
              currentPeriodStart,
              currentPeriodEnd,
              paddlePlanId: subscription.plan_id?.toString() || subscription.paddlePlanId,
              updatedAt: new Date(),
            },
          })
          break

        case 'subscription.canceled':
          await prisma.subscription.updateMany({
            where: { paddleSubscriptionId },
            data: {
              status: 'canceled',
              updatedAt: new Date(),
            },
          })
          break
      }
    }

    // Handle transaction events (for payment confirmations)
    if (paddleEventType === 'transaction.completed') {
      const transaction = data.data
      const subscriptionId = transaction.subscription_id?.toString()

      if (subscriptionId) {
        // Update subscription status if payment successful
        await prisma.subscription.updateMany({
          where: { paddleSubscriptionId: subscriptionId },
          data: {
            status: 'active',
            updatedAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Paddle webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

