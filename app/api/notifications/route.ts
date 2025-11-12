import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getUnreadNotifications, markAllNotificationsRead } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications
 * Get unread notifications for current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const notifications = await getUnreadNotifications(user.id, limit)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await markAllNotificationsRead(user.id)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('[POST /api/notifications/read-all] Error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
