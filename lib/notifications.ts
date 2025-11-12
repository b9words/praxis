/**
 * Notification service
 * Handles in-app notifications for replies, likes, and resume nudges
 * Gracefully handles missing notification table (no-op if table doesn't exist)
 */

import { dbCall } from './db/utils'

export type NotificationType = 'like' | 'reply' | 'resume_nudge'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  metadata?: Record<string, any>
}

/**
 * Create a notification (best-effort, no-op if table doesn't exist)
 */
export async function createNotification(data: CreateNotificationData): Promise<boolean> {
  try {
    await dbCall(async (prisma) => {
      // Check if Notification model exists by attempting to create
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          metadata: data.metadata || {},
          read: false,
        },
      })
    })
    return true
  } catch (error: any) {
    // If table doesn't exist or other error, silently fail (best-effort)
    console.debug('Notification creation failed (best-effort):', error?.message)
    return false
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string, limit: number = 20) {
  try {
    return await dbCall(async (prisma) => {
      return prisma.notification.findMany({
        where: {
          userId,
          read: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
    })
  } catch (error: any) {
    // If table doesn't exist, return empty array
    console.debug('Notification fetch failed (best-effort):', error?.message)
    return []
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    await dbCall(async (prisma) => {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId, // Ensure user owns the notification
        },
        data: {
          read: true,
        },
      })
    })
    return true
  } catch (error: any) {
    console.debug('Notification update failed (best-effort):', error?.message)
    return false
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  try {
    await dbCall(async (prisma) => {
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      })
    })
    return true
  } catch (error: any) {
    console.debug('Notification update failed (best-effort):', error?.message)
    return false
  }
}

