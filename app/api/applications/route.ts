import { requireAuth, requireRole } from '@/lib/auth/authorize'
import { sendApplicationStatusEmail } from '@/lib/email'
import { notifyApplicationStatus } from '@/lib/notifications/triggers'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/applications
 * List applications (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'editor'])
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as any } : {}

    const applications = await prisma.userApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ applications })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

/**
 * POST /api/applications
 * Submit a new application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, motivation, background } = body

    if (!email || !motivation) {
      return NextResponse.json(
        { error: 'Missing required fields: email and motivation' },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    let userId: string | undefined
    try {
      const user = await requireAuth()
      userId = user.id
    } catch {
      // User not authenticated, application can still be submitted
      userId = undefined
    }

    // Check if application already exists for this user/email
    if (userId) {
      const existing = await prisma.userApplication.findFirst({
        where: {
          userId,
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Application already exists for this user' },
          { status: 400 }
        )
      }
    }

    const application = await prisma.userApplication.create({
      data: {
        userId: userId || null,
        email,
        fullName: fullName || null,
        motivation,
        background: background || null,
        status: 'pending',
      },
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}

/**
 * PATCH /api/applications
 * Update application status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const reviewer = await requireRole(['admin', 'editor'])
    const body = await request.json()
    const { applicationId, status, notes } = body

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId and status' },
        { status: 400 }
      )
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      )
    }

    const application = await prisma.userApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const updated = await prisma.userApplication.update({
      where: { id: applicationId },
      data: {
        status: status as any,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
        notes: notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    // Send email and in-app notification
    if (status === 'approved' || status === 'rejected') {
      try {
        // Send email
        await sendApplicationStatusEmail(
          application.email,
          status,
          application.fullName || undefined
        )
        
        // Create in-app notification if user exists
        if (application.userId) {
          await notifyApplicationStatus(
            application.userId,
            application.email,
            status,
            application.id
          )
        }
      } catch (error) {
        console.error('Failed to send application notifications:', error)
        // Don't fail the request if notifications fail
      }
    }

    return NextResponse.json({ application: updated })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    console.error('Error updating application:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

