/**
 * Subscription status utilities
 * Centralized helper for checking subscription status with safe error handling
 */

import { safeFindUnique } from '../prisma-safe'

export interface SubscriptionStatus {
  hasSubscription: boolean
  isActive: boolean
  status?: string
  subscriptionId?: string
}

/**
 * Get user subscription status
 * Returns subscription information with safe error handling for missing tables
 */
export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const result = await safeFindUnique<any>(
    'subscription',
    { userId }
  )

  const subscription = result.data

  if (!subscription) {
    return {
      hasSubscription: false,
      isActive: false,
    }
  }

  const now = new Date()
  const isActive = subscription.status === 'active' && subscription.currentPeriodEnd >= now

  return {
    hasSubscription: true,
    isActive,
    status: subscription.status,
    subscriptionId: subscription.id,
  }
}

