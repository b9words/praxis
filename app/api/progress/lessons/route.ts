import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const domainId = searchParams.get('domainId')
    const status = searchParams.get('status')

    const where: any = {
      userId: user.id,
    }

    if (domainId) {
      where.domainId = domainId
    }
    if (status) {
      where.status = status
    }

    const progress = await prisma.userLessonProgress.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ progress })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching lesson progress:', error)
    return NextResponse.json({ error: 'Failed to fetch lesson progress' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      domainId,
      moduleId,
      lessonId,
      status = 'in_progress',
      progressPercentage = 0,
      timeSpentSeconds = 0,
      lastReadPosition = {},
      bookmarked = false,
    } = body

    if (!domainId || !moduleId || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_domainId_moduleId_lessonId: {
          userId: user.id,
          domainId,
          moduleId,
          lessonId,
        },
      },
      update: {
        status,
        progressPercentage,
        timeSpentSeconds,
        lastReadPosition: lastReadPosition as any,
        bookmarked,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
      create: {
        userId: user.id,
        domainId,
        moduleId,
        lessonId,
        status,
        progressPercentage,
        timeSpentSeconds,
        lastReadPosition: lastReadPosition as any,
        bookmarked,
        completedAt: status === 'completed' ? new Date() : null,
      },
    })

    return NextResponse.json({ progress }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error creating lesson progress:', error)
    return NextResponse.json({ error: 'Failed to create lesson progress' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      domainId,
      moduleId,
      lessonId,
      status,
      progressPercentage,
      timeSpentSeconds,
      lastReadPosition,
      bookmarked,
    } = body

    if (!domainId || !moduleId || !lessonId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const progress = await prisma.userLessonProgress.update({
      where: {
        userId_domainId_moduleId_lessonId: {
          userId: user.id,
          domainId,
          moduleId,
          lessonId,
        },
      },
      data: {
        status,
        progressPercentage,
        timeSpentSeconds,
        lastReadPosition: lastReadPosition as any,
        bookmarked,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    })

    return NextResponse.json({ progress })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating lesson progress:', error)
    return NextResponse.json({ error: 'Failed to update lesson progress' }, { status: 500 })
  }
}

