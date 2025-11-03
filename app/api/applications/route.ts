import { requireRole } from '@/lib/auth/authorize'
import { sendApplicationStatusEmail } from '@/lib/email'
import { notifyApplicationStatus } from '@/lib/notifications/triggers'
import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/applications
 * List applications (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin'])
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as any } : {}

    let applications: any[] = []
    try {
      applications = await (prisma as any).userApplication.findMany({
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
    } catch (error: any) {
      if (isMissingTable(error)) {
        applications = []
      } else {
        throw error
      }
    }

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
      const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
      userId = user.id
    } catch {
      // User not authenticated, application can still be submitted
      userId = undefined
    }

    // Check if application already exists for this user/email
    if (userId) {
      try {
        const existing = await (prisma as any).userApplication.findFirst({
          where: { userId },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Application already exists for this user' },
            { status: 400 }
          )
        }
      } catch (error: any) {
        if (!isMissingTable(error)) {
          throw error
        }
      }
    }

    let application
    try {
      application = await (prisma as any).userApplication.create({
        data: {
          userId: userId || null,
          email,
          fullName: fullName || null,
          motivation,
          background: background || null,
          status: 'pending',
        },
      })
    } catch (error: any) {
      if (isMissingTable(error)) {
        return NextResponse.json(
          { error: 'Applications feature is not available' },
          { status: 503 }
        )
      }
      throw error
    }

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
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const reviewer = await getCurrentUser()
    
    if (!reviewer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const profile = await prisma.profile.findUnique({
      where: { id: reviewer.id },
      select: { role: true },
    })

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    let application
    try {
      application = await (prisma as any).userApplication.findUnique({
        where: { id: applicationId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      })
    } catch (error: any) {
      if (isMissingTable(error)) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }
      throw error
    }

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    let updated
    try {
      updated = await (prisma as any).userApplication.update({
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
    } catch (error: any) {
      if (isMissingTable(error) || error?.code === 'P2022') {
        return NextResponse.json(
          { error: 'Applications feature is not available' },
          { status: 503 }
        )
      }
      throw error
    }

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
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating application:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

