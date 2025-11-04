import { getCachedCompetencies } from '@/lib/cache'
import { listCompetencies, createCompetency, getCompetencyBasic } from '@/lib/db/competencies'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const level = searchParams.get('level')
    const parentId = searchParams.get('parentId')
    const residencyYear = searchParams.get('residencyYear')

    // If no filters, use cached competencies (24h revalidate)
    if (!level && !parentId && !residencyYear) {
      const competencies = await getCachedCompetencies()
      return NextResponse.json({ competencies })
    }

    // With filters, cache with filter params in key (1h revalidate)
    const { cache, CacheTags } = await import('@/lib/cache')
    const getCachedFilteredCompetencies = cache(
      async () => {
        const filters: any = {}
        if (level) filters.level = level
        if (parentId !== null) {
          filters.parentId = parentId || null
        }
        if (residencyYear) {
          filters.residencyYear = parseInt(residencyYear)
        }

        return listCompetencies(filters)
      },
      ['api', 'competencies', level || 'all', parentId || 'all', residencyYear || 'all'],
      {
        tags: [CacheTags.COMPETENCIES],
        revalidate: 3600, // 1 hour
      }
    )

    const competencies = await getCachedFilteredCompetencies()

    return NextResponse.json({ competencies })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching competencies:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.level) {
      return NextResponse.json(
        { error: 'Name and level are required' },
        { status: 400 }
      )
    }

    // Validate parent relationship
    if (body.parentId) {
      const parent = await getCompetencyBasic(body.parentId)
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent competency not found' },
          { status: 404 }
        )
      }
    }

    const competency = await createCompetency({
      name: body.name,
      description: body.description || null,
      parentId: body.parentId || null,
      level: body.level,
      residencyYear: body.residencyYear ? parseInt(body.residencyYear) : null,
      displayOrder: body.displayOrder ? parseInt(body.displayOrder) : 0,
    })

    return NextResponse.json({ competency })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error creating competency:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}
