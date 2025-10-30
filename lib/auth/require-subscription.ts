import { prisma } from '../prisma/server';
import { getCurrentUser } from './get-user';

/**
 * Check if the current user has an active subscription
 * Returns user info if subscription is active, throws error otherwise
 */
export async function requireSubscription(): Promise<{ id: string; subscriptionId: string }> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check for active subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (!subscription) {
    throw new Error('Subscription required')
  }

  // Check if subscription is active and not expired
  const now = new Date()
  if (subscription.status !== 'active' || subscription.currentPeriodEnd < now) {
    throw new Error('Active subscription required')
  }

  return {
    id: user.id,
    subscriptionId: subscription.id,
  }
}

/**
 * Check if user has active subscription (non-throwing version)
 * Returns subscription status and user info
 */
export async function checkSubscription(): Promise<{
  hasSubscription: boolean
  isActive: boolean
  userId: string
  subscriptionId?: string
}> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      hasSubscription: false,
      isActive: false,
      userId: '',
    }
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (!subscription) {
    return {
      hasSubscription: false,
      isActive: false,
      userId: user.id,
    }
  }

  const now = new Date()
  const isActive = subscription.status === 'active' && subscription.currentPeriodEnd >= now

  return {
    hasSubscription: true,
    isActive,
    userId: user.id,
    subscriptionId: subscription.id,
  }
}

