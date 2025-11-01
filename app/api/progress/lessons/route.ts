import { isMissingTable } from '@/lib/api/route-helpers'
import { ensureProfileExists } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { ensureUserLessonProgressTable } from '@/lib/db/schemaGuard'
import { getAllUserProgress, updateLessonProgress } from '@/lib/progress-tracking'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ progress: [] }, { status: 200 })
    }

    // Ensure profile exists (non-blocking)
    await ensureProfileExists(user.id, user.email || undefined)
    const searchParams = request.nextUrl.searchParams
    const domainId = searchParams.get('domainId')
    const status = searchParams.get('status')

    // Use the helper function instead of direct Prisma calls
    // Handle P2021 (missing table) errors
    let progressMap = new Map()
    try {
      progressMap = await getAllUserProgress(user.id)
    } catch (error: any) {
      // Handle missing table (P2021)
      if (isMissingTable(error)) {
        // In dev, try to create the table
        if (process.env.NODE_ENV === 'development') {
          await ensureUserLessonProgressTable()
          
          // Retry once after creating table
          try {
            progressMap = await getAllUserProgress(user.id)
          } catch (retryError) {
            // Still failed, return empty array
            return NextResponse.json({ progress: [] }, { status: 200 })
          }
        } else {
          // Non-dev: return empty array
          return NextResponse.json({ progress: [] }, { status: 200 })
        }
      } else {
        // Other errors: return empty array
        return NextResponse.json({ progress: [] }, { status: 200 })
      }
    }
    
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
      return NextResponse.json({ progress: [] }, { status: 200 })
    }
    // Silently return empty progress if profile doesn't exist yet
    if (error instanceof Error && error.message.includes('Profile not found')) {
      return NextResponse.json({ progress: [] }, { status: 200 })
    }
    console.error('Error fetching lesson progress:', error)
    // Return empty progress to prevent refresh loops
    return NextResponse.json({ progress: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Ensure profile exists
    await ensureProfileExists(user.id, user.email || undefined)
    const authUser = { id: user.id, role: 'member' as const }
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

    const progress = await updateLessonProgress(authUser.id, domainId, moduleId, lessonId, {
      status,
      progress_percentage: progressPercentage,
      time_spent_seconds: timeSpentSeconds,
      last_read_position: lastReadPosition,
      bookmarked,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
    }).catch(() => null)

    if (!progress) {
      // Silently return success for profile-related failures
      return NextResponse.json({ progress: null }, { status: 201 })
    }

    return NextResponse.json({ progress }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    // Silently handle profile creation issues
    if (error instanceof Error && error.message.includes('Profile not found')) {
      return NextResponse.json({ progress: null }, { status: 201 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error creating lesson progress:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Ensure profile exists
    await ensureProfileExists(user.id, user.email || undefined)
    const authUser = { id: user.id, role: 'member' as const }
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

    const progress = await updateLessonProgress(authUser.id, domainId, moduleId, lessonId, {
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
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating lesson progress:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

