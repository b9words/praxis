/**
 * NewsletterSubscriber repository
 * All newsletter subscriber database operations go through here
 */

import { dbCall } from './utils'

/**
 * Create a new newsletter subscriber
 */
export async function createNewsletterSubscriber(email: string) {
  return dbCall(async (prisma) => {
    return prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    })
  })
}

/**
 * Get all newsletter subscribers
 */
export async function getAllNewsletterSubscribers() {
  return dbCall(async (prisma) => {
    return prisma.newsletterSubscriber.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
}

/**
 * Get subscriber count
 */
export async function getSubscriberCount() {
  return dbCall(async (prisma) => {
    return prisma.newsletterSubscriber.count()
  })
}


