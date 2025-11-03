/**
 * Subscription status utilities
 * Centralized helper for checking subscription status with safe error handling
 */

import { prisma } from '../prisma/server'
import { isMissingTable } from '../api/route-helpers'

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
  let subscription: any = null
  try {
    subscription = await prisma.subscription.findUnique({
      where: { userId },
    })
  } catch (error: any) {
    if (isMissingTable(error)) {
      return {
        hasSubscription: false,
        isActive: false,
      }
    }
    throw error
  }

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

