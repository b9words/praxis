import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { markNotificationRead } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/[id]/read
 * Mark a specific notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const success = await markNotificationRead(id, user.id)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('[POST /api/notifications/[id]/read] Error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}

