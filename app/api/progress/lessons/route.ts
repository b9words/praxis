import { requireAuth } from '@/lib/auth/authorize'
import { getAllUserProgress, updateLessonProgress } from '@/lib/progress-tracking'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const domainId = searchParams.get('domainId')
    const status = searchParams.get('status')

    // Use the helper function instead of direct Prisma calls
    const progressMap = await getAllUserProgress(user.id)
    let progress = Array.from(progressMap.values())

    // Filter by domainId if specified
    if (domainId) {
      progress = progress.filter(p => p.domain_id === domainId)
    }

    // Filter by status if specified  
    if (status) {
      progress = progress.filter(p => p.status === status)
    }

    // Sort by updated date (most recent first)
    progress.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

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

    const progress = await updateLessonProgress(user.id, domainId, moduleId, lessonId, {
      status,
      progress_percentage: progressPercentage,
      time_spent_seconds: timeSpentSeconds,
      last_read_position: lastReadPosition,
      bookmarked,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
    })

    if (!progress) {
      return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 })
    }

    return NextResponse.json({ progress }, { status: 201 })
  } catch (error: any) {
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

    const progress = await updateLessonProgress(user.id, domainId, moduleId, lessonId, {
      status,
      progress_percentage: progressPercentage,
      time_spent_seconds: timeSpentSeconds,
      last_read_position: lastReadPosition,
      bookmarked,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
    })

    if (!progress) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    return NextResponse.json({ progress })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating lesson progress:', error)
    return NextResponse.json({ error: 'Failed to update lesson progress' }, { status: 500 })
  }
}

