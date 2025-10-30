import { requireAuth } from '@/lib/auth/authorize'
import { getLessonProgress, updateLessonProgress } from '@/lib/progress-tracking'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = await requireAuth()
    const { lessonId } = await params
    const searchParams = request.nextUrl.searchParams
    const domainId = searchParams.get('domainId')
    const moduleId = searchParams.get('moduleId')

    if (!domainId || !moduleId) {
      return NextResponse.json({ error: 'Missing domainId or moduleId' }, { status: 400 })
    }

    const progress = await getLessonProgress(user.id, domainId, moduleId, lessonId)

    if (!progress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 })
    }

    return NextResponse.json({ progress })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching lesson progress:', error)
    return NextResponse.json({ error: 'Failed to fetch lesson progress' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const user = await requireAuth()
    const { lessonId } = await params
    const body = await request.json()

    const {
      domainId,
      moduleId,
      status,
      progressPercentage,
      timeSpentSeconds,
      lastReadPosition,
      bookmarked,
    } = body

    if (!domainId || !moduleId) {
      return NextResponse.json({ error: 'Missing domainId or moduleId' }, { status: 400 })
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

