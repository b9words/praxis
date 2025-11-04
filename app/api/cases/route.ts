import { cache, CacheTags } from '@/lib/cache'
import { listCases, createCase } from '@/lib/db/cases'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    // Cache cases list (15 minutes revalidate)
    const getCachedCases = cache(
      async () => {
        return listCases({
          status: status || undefined,
        })
      },
      ['api', 'cases', status || 'all'],
      {
        tags: [CacheTags.CASES],
        revalidate: 900, // 15 minutes
      }
    )

    const cases = await getCachedCases()

    return NextResponse.json({ cases })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching cases:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const body = await request.json()

    const {
      title,
      briefingDoc,
      description,
      datasets,
      rubric,
      status = 'draft',
      difficulty,
      estimatedMinutes,
      prerequisites,
      storagePath,
      metadata,
      competencyIds = [],
    } = body

    if (!title || !rubric) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const caseItem = await createCase({
      title,
      briefingDoc: briefingDoc || null,
      description,
      datasets: datasets || null,
      rubric,
      status,
      difficulty,
      estimatedMinutes,
      prerequisites: prerequisites || [],
      storagePath: storagePath || null,
      metadata: metadata || {},
      competencyIds: competencyIds || [],
      createdBy: user.id,
      updatedBy: user.id,
    })

    return NextResponse.json({ case: caseItem }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error creating case:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

