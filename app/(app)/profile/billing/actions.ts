'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'

export async function handleManageBilling() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (!subscription) {
    return
  }

  // This would typically call Paddle's API to get the billing portal URL
  // For now, we'll redirect to Paddle's customer portal
  // You'll need to implement this based on Paddle's API
  const paddleCustomerPortalUrl = `${process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox' ? 'https://sandbox-vendors.paddle.com' : 'https://vendors.paddle.com'}/customers/${subscription.paddleSubscriptionId}/portal`
  redirect(paddleCustomerPortalUrl)
}

