import { isMissingTable } from '@/lib/api/route-helpers'
import { ensureProfileExists } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { ensureNotificationsTable } from '@/lib/db/schemaGuard'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

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

    const where: any = {
      userId: user.id,
    }

    if (read !== null) {
      where.read = read === 'true'
    }

    try {
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
    } catch (error: any) {
      // Handle missing table (P2021)
      if (isMissingTable(error)) {
        // In dev, try to create the table
        if (process.env.NODE_ENV === 'development') {
          await ensureNotificationsTable()
          
          // Retry once after creating table
          try {
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
          } catch (retryError) {
            // Still failed, return defaults
            return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 })
          }
        }
        
        // Non-dev or retry failed: return empty arrays
        return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 })
      }
      
      // Other errors: return empty arrays
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
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
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
      await prisma.notification.updateMany({
        where: {
          userId: authUser.id,
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
        userId: authUser.id, // Ensure user can only update their own notifications
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}
