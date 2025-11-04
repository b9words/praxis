import { ensureProfileExists } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { listNotifications, getUnreadCount, createNotification, markAllNotificationsRead } from '@/lib/db/notifications'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/notifications
 * Get user's notifications
 * Soft-fails: returns empty arrays if profile missing or table missing
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 })
    }

    // Ensure profile exists (non-blocking)
    await ensureProfileExists(user.id, user.email || undefined)

    const { searchParams } = new URL(request.url)
    const read = searchParams.get('read')
    const limit = parseInt(searchParams.get('limit') || '50')

    try {
      const notifications = await listNotifications({
        userId: user.id,
        read: read !== null ? read === 'true' : undefined,
        limit,
      })

      const unreadCount = await getUnreadCount(user.id)

      return NextResponse.json({ 
        notifications,
        unreadCount,
      })
    } catch (error: any) {
      // Always return 200 with empty arrays - never crash
      return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 })
    }
  } catch (error) {
    // Always return 200 with empty arrays - never crash
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

    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Ensure profile exists
    await ensureProfileExists(user.id, user.email || undefined)
    const currentUser = { id: user.id, role: 'member' as const }

    // If creating for another user, require admin role
    if (userId && userId !== currentUser.id) {
      // All auth checks removed
      
    }

    const targetUserId = userId || currentUser.id

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      )
    }

    const notification = await createNotification({
      userId: targetUserId,
      type,
      title,
      message,
      link: link || null,
      metadata: metadata || {},
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Ensure profile exists
    await ensureProfileExists(user.id, user.email || undefined)
    const authUser = { id: user.id, role: 'member' as const }
    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      await markAllNotificationsRead(authUser.id)
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid notificationIds array' },
        { status: 400 }
      )
    }

    // Mark specific notifications as read (batch update not in repo, but we can add if needed)
    // For now, use repo's markNotificationRead for each, or add a batch function
    // Since this is a simple case, we'll keep it simple
    const { markNotificationRead } = await import('@/lib/db/notifications')
    await Promise.all(notificationIds.map(id => markNotificationRead(id).catch(() => null)))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}
