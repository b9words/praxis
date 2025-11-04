/**
 * Notifications repository
 * All notification database operations go through here
 */

import { dbCall } from './utils'
import type { Prisma } from '@prisma/client'

export interface CreateNotificationData {
  userId: string
  type: string
  title: string
  message: string
  link?: string | null
  metadata?: Record<string, any>
}

/**
 * List notifications for a user
 */
export async function listNotifications(filters: {
  userId: string
  read?: boolean
  limit?: number
}) {
  const where: Prisma.NotificationWhereInput = {
    userId: filters.userId,
  }

  if (filters.read !== undefined) {
    where.read = filters.read
  }

  return dbCall(async (prisma) => {
    return prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit ?? 50,
    })
  }).catch(() => []) // Return empty array on error
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return dbCall(async (prisma) => {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    })
  }).catch(() => 0)
}

/**
 * Create a notification
 */
export async function createNotification(data: CreateNotificationData) {
  return dbCall(async (prisma) => {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link ?? null,
        metadata: data.metadata ?? {},
      },
    })
  })
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(id: string) {
  return dbCall(async (prisma) => {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    })
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    })
  })
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string) {
  return dbCall(async (prisma) => {
    return prisma.notification.delete({
      where: { id },
    })
  })
}

