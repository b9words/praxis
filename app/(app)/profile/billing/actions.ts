'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'

/**
 * Generate a customer portal URL using Paddle's Management API
 * First fetches the subscription to get customer_id, then generates portal URL
 */
async function getPaddlePortalUrl(subscriptionId: string): Promise<string> {
  const paddleApiKey = process.env.PADDLE_API_KEY
  const paddleApiUrl = process.env.PADDLE_API_URL || 
    (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox' 
      ? 'https://sandbox-api.paddle.com' 
      : 'https://api.paddle.com')

  if (!paddleApiKey) {
    throw new Error('PADDLE_API_KEY not configured')
  }

  try {
    // First, fetch the subscription to get the customer_id
    const subscriptionResponse = await fetch(`${paddleApiUrl}/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!subscriptionResponse.ok) {
      throw new Error(`Failed to fetch subscription: ${subscriptionResponse.status}`)
    }

    const subscriptionData = await subscriptionResponse.json()
    const customerId = subscriptionData.data?.customer_id || subscriptionData.customer_id

    if (!customerId) {
      throw new Error('Customer ID not found in subscription')
    }

    // Generate portal URL using customer_id
    const portalResponse = await fetch(`${paddleApiUrl}/customers/${customerId}/portal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text()
      throw new Error(`Paddle API error: ${portalResponse.status} - ${errorText}`)
    }

    const portalData = await portalResponse.json()
    return portalData.data?.url || portalData.url || portalData.portal_url
  } catch (error) {
    console.error('Error fetching Paddle portal URL:', error)
    
    // Fallback: Construct portal URL if API call fails
    // This may work for some Paddle account configurations
    const baseUrl = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox'
      ? 'https://sandbox-vendors.paddle.com'
      : 'https://vendors.paddle.com'
    
    return `${baseUrl}/subscriptions/${subscriptionId}`
  }
}

export async function handleManageBilling() {
  const user = await getCurrentUser()

  // All auth checks removed
  if (!user) {
    throw new Error('No user found')
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (!subscription) {
    throw new Error('No subscription found')
  }

  try {
    const portalUrl = await getPaddlePortalUrl(subscription.paddleSubscriptionId)
    // All redirects removed - return URL instead
    return { portalUrl }
  } catch (error) {
    console.error('Failed to get billing portal URL:', error)
    throw new Error('Unable to access billing portal. Please contact support.')
  }
}
