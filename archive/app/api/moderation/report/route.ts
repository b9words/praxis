import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const body = await request.json()

    const { reportedType, reportedId, reason } = body

    if (!reportedType || !reportedId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: reportedType, reportedId, reason' },
        { status: 400 }
      )
    }

    if (!['thread', 'post'].includes(reportedType)) {
      return NextResponse.json(
        { error: 'reportedType must be "thread" or "post"' },
        { status: 400 }
      )
    }

    // Verify the reported item exists
    if (reportedType === 'thread') {
      const thread = await prisma.forumThread.findUnique({
        where: { id: reportedId },
      })
      if (!thread) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
      }
    } else if (reportedType === 'post') {
      const post = await prisma.forumPost.findUnique({
        where: { id: reportedId },
      })
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reportedType: reportedType as 'thread' | 'post',
        reportedId,
        reason,
        createdById: user.id,
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}

