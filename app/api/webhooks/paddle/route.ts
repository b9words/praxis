import { serverAnalyticsTracker } from '@/lib/analytics'
import { sendSubscriptionConfirmationEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@supabase/supabase-js'
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

    // Check for idempotency using event_id from Paddle
    const eventId = data?.event_id || data?.event?.id || null
    if (eventId) {
      // Use Supabase Admin client to check webhook_events table
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { data: existingEvent } = await supabaseAdmin
        .from('webhook_events')
        .select('id')
        .eq('event_id', eventId.toString())
        .single()

      if (existingEvent) {
        // Event already processed
        return NextResponse.json({ received: true, duplicate: true })
      }

      // Store event for idempotency
      await supabaseAdmin.from('webhook_events').insert({
        event_id: eventId.toString(),
        event_type: paddleEventType,
        payload: data,
        headers: Object.fromEntries(request.headers.entries()),
      })
    }

    // Handle subscription events
    if (paddleEventType.includes('subscription')) {
      const subscription = data.data
      const paddleSubscriptionId = subscription.id?.toString()
      const customerId = subscription.customer_id?.toString()

      if (!paddleSubscriptionId || !customerId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      // Extract customer email from Paddle webhook data
      const customerEmail = subscription.customer?.email || subscription.customer?.email_address
      
      // Try to find user by paddleCustomerId stored in passthrough or by email
      // First, check if passthrough contains userId (from checkout)
      let userId: string | null = null
      if (subscription.custom_data) {
        try {
          const customData = typeof subscription.custom_data === 'string' 
            ? JSON.parse(subscription.custom_data) 
            : subscription.custom_data
          userId = customData.userId || null
        } catch {
          // Ignore parse errors
        }
      }

      // Try passthrough field if custom_data didn't work
      if (!userId && subscription.passthrough) {
        try {
          const passthrough = typeof subscription.passthrough === 'string'
            ? JSON.parse(subscription.passthrough)
            : subscription.passthrough
          userId = passthrough.userId || null
        } catch {
          // Ignore parse errors
        }
      }

      let profile = null

      // Try to find profile by userId first (most reliable)
      if (userId) {
        profile = await prisma.profile.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            isPublic: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        
        if (!profile) {
          console.error('Paddle webhook: userId provided in passthrough but user not found', {
            userId,
            paddleSubscriptionId,
            eventType: paddleEventType,
          })
          // Continue to email fallback below
        } else {
          console.log('Paddle webhook: Successfully found user by userId from passthrough', {
            userId,
            paddleSubscriptionId,
            eventType: paddleEventType,
          })
        }
      }

      // Fallback: Look up by email using Supabase Admin API
      if (!profile && customerEmail) {
        console.log('Paddle webhook: Falling back to email lookup', {
          customerEmail,
          paddleSubscriptionId,
          eventType: paddleEventType,
          hadUserId: !!userId,
        })
        try {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false,
              },
            }
          )

          // Query auth.users for email
          const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
          
          if (!authError && authUsers?.users) {
            const authUser = authUsers.users.find(user => 
              user.email?.toLowerCase() === customerEmail.toLowerCase()
            )
            
            if (authUser) {
              profile = await prisma.profile.findUnique({
                where: { id: authUser.id },
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatarUrl: true,
                  bio: true,
                  isPublic: true,
                  role: true,
                  createdAt: true,
                  updatedAt: true,
                },
              })
            }
          }
        } catch (error) {
          console.error('Error looking up user by email:', error)
        }
      }

      // If still no profile found and it's a creation event, log error
      if (!profile && paddleEventType === 'subscription.created') {
        console.error('User not found for Paddle customer:', customerId, 'Email:', customerEmail)
        return NextResponse.json({ 
          error: 'User not found',
          details: 'No matching user found for Paddle customer. User must be authenticated during checkout.'
        }, { status: 404 })
      }

      // For update/cancel events, subscription might already exist
      if (!profile && (paddleEventType === 'subscription.updated' || paddleEventType === 'subscription.canceled')) {
        // Try to find existing subscription and get userId from there
        let existingSubscription: any = null
        try {
          existingSubscription = await prisma.subscription.findUnique({
            where: { paddleSubscriptionId },
          })
        } catch (error: any) {
          if (!isMissingTable(error)) {
            console.error('Error finding existing subscription:', error)
          }
        }
        
        if (existingSubscription) {
          profile = await prisma.profile.findUnique({
            where: { id: existingSubscription.userId },
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              bio: true,
              isPublic: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        }
      }

      // If we still don't have a profile, we can't proceed
      if (!profile) {
        console.error('Unable to resolve user for Paddle subscription:', paddleSubscriptionId)
        return NextResponse.json({ 
          error: 'User not found',
          details: 'Unable to resolve user for subscription event'
        }, { status: 404 })
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
          let createdSubscription: any = null
          try {
            createdSubscription = await prisma.subscription.upsert({
              where: { paddleSubscriptionId },
              create: {
                userId: profile!.id,
                paddleSubscriptionId,
                paddlePlanId: subscription.plan_id?.toString() || '',
                status,
                currentPeriodStart,
                currentPeriodEnd,
              },
              update: {
                status,
                currentPeriodStart,
                currentPeriodEnd,
                updatedAt: new Date(),
              },
            })
          } catch (error: any) {
            if (!isMissingTable(error)) {
              console.error('Failed to upsert subscription:', error)
            }
            // Continue processing even if subscription save fails (non-critical)
          }
          
          // Send subscription confirmation email
          try {
            // Get user email from Supabase auth
            const supabaseAdmin = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                },
              }
            )
            
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile!.id)
            
            if (authUser?.user?.email) {
              await sendSubscriptionConfirmationEmail(
                authUser.user.email,
                subscription.plan_id?.toString() || 'Subscription',
                profile!.fullName || undefined
              )
            }
          } catch (emailError) {
            console.error('Failed to send subscription confirmation email:', emailError)
            // Don't fail webhook if email fails
          }

          // Track subscription started event
          try {
            await serverAnalyticsTracker.track('subscription_started', {
              subscriptionId: paddleSubscriptionId,
              planId: subscription.plan_id?.toString() || '',
              userId: profile!.id,
            })
          } catch (analyticsError) {
            console.error('Failed to track subscription started:', analyticsError)
            // Don't fail webhook if analytics fails
          }
          
          break

        case 'subscription.updated':
          {
            try {
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
            } catch (error: any) {
              if (!isMissingTable(error)) {
                console.error('Failed to update subscription:', error)
              }
            }
          }
          break

        case 'subscription.canceled':
          {
            try {
              await prisma.subscription.updateMany({
                where: { paddleSubscriptionId },
                data: {
                  status: 'canceled',
                  updatedAt: new Date(),
                },
              })
            } catch (error: any) {
              if (!isMissingTable(error)) {
                console.error('Failed to cancel subscription:', error)
              }
            }
          }
          break

        case 'subscription.paused':
          {
            try {
              await prisma.subscription.updateMany({
                where: { paddleSubscriptionId },
                data: {
                  status: 'paused',
                  updatedAt: new Date(),
                },
              })
            } catch (error: any) {
              if (!isMissingTable(error)) {
                console.error('Failed to pause subscription:', error)
              }
            }
          }
          break

        case 'subscription.past_due':
          {
            try {
              await prisma.subscription.updateMany({
                where: { paddleSubscriptionId },
                data: {
                  status: 'past_due',
                  updatedAt: new Date(),
                },
              })
            } catch (error: any) {
              if (!isMissingTable(error)) {
                console.error('Failed to update subscription to past_due:', error)
              }
            }
          }
          
          // Optionally send notification email for past due
          try {
            const supabaseAdmin = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                },
              }
            )
            
            const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile!.id)
            
            if (authUser?.user?.email) {
              const { sendGeneralNotificationEmail } = await import('@/lib/email')
              await sendGeneralNotificationEmail(
                authUser.user.email,
                {
                  title: 'Payment Past Due',
                  message: 'Your subscription payment is past due. Please update your payment method to continue your access to Execemy.',
                  actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'}/profile/billing`,
                  actionText: 'Update Payment Method',
                  userName: profile!.fullName || undefined,
                }
              )
            }
          } catch (emailError) {
            console.error('Failed to send past due notification email:', emailError)
            // Don't fail webhook if email fails
          }
          break
      }
    }

    // Handle transaction events (for payment confirmations)
    if (paddleEventType === 'transaction.completed') {
      const transaction = data.data
      const subscriptionId = transaction.subscription_id?.toString()

      if (subscriptionId) {
        // Update subscription status if payment successful
        let subscriptionData: any = null
        try {
          subscriptionData = await prisma.subscription.findFirst({
            where: { paddleSubscriptionId: subscriptionId },
            select: { userId: true, paddlePlanId: true },
          })
        } catch (error: any) {
          if (!isMissingTable(error)) {
            console.error('Failed to find subscription:', error)
          }
        }

        try {
          await prisma.subscription.updateMany({
            where: { paddleSubscriptionId: subscriptionId },
            data: {
              status: 'active',
              updatedAt: new Date(),
            },
          })
        } catch (error: any) {
          if (!isMissingTable(error)) {
            console.error('Failed to update subscription status from transaction:', error)
          }
        }

        // Track subscription started event on first successful payment
        if (subscriptionData) {
          try {
            await serverAnalyticsTracker.track('subscription_started', {
              subscriptionId,
              planId: subscriptionData.paddlePlanId || '',
              userId: subscriptionData.userId,
            })
          } catch (analyticsError) {
            console.error('Failed to track subscription started from transaction:', analyticsError)
            // Don't fail webhook if analytics fails
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Paddle webhook:', error)
    Sentry.addBreadcrumb({
      category: 'webhook',
      level: 'error',
      message: 'Paddle webhook processing failed',
      data: { error: error instanceof Error ? error.message : String(error) },
    })
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

