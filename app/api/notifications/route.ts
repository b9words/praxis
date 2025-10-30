import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/notifications
 * Get user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const read = searchParams.get('read')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: user.id,
    }

    if (read !== null) {
      where.read = read === 'true'
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    })

    return NextResponse.json({ 
      notifications,
      unreadCount,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 })
    }
    if (error instanceof Error && error.message === 'Profile not found') {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 })
    }
    console.error('Error fetching notifications:', error)
    // Return empty array instead of 500 to prevent refresh loops
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 })
  }
}

/**
 * POST /api/notifications
 * Create a notification (typically done by system, but can be used for testing)
 */
export async function POST(request: NextRequest) {
  try {
    // Allow authenticated users to create notifications for themselves
    // or require admin role for creating notifications for others
    const body = await request.json()
    const { userId, type, title, message, link, metadata } = body

    const currentUser = await requireAuth()

    // If creating for another user, require admin role
    if (userId && userId !== currentUser.id) {
      const { requireRole } = await import('@/lib/auth/authorize')
      await requireRole(['admin'])
    }

    const targetUserId = userId || currentUser.id

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: type as any,
        title,
        message,
        link: link || null,
        metadata: metadata || {},
        read: false,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
        },
      })

      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid notificationIds array' },
        { status: 400 }
      )
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: user.id, // Ensure user can only update their own notifications
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
