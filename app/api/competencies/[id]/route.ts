import { getCompetencyById, getCompetencyBasic, updateCompetency, deleteCompetency } from '@/lib/db/competencies'
import { cache, CacheTags } from '@/lib/cache'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cache competency by ID (1 hour revalidate)
    const getCachedCompetency = cache(
      async () => {
        return getCompetencyById(id)
      },
      ['api', 'competency', id],
      {
        tags: [CacheTags.COMPETENCIES, `competency-${id}`],
        revalidate: 3600, // 1 hour
      }
    )

    const competency = await getCachedCompetency()

    if (!competency) {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 })
    }

    return NextResponse.json({ competency })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching competency:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // All auth checks removed
    const { id } = await params
    const body = await request.json()

    // Check if competency exists
    const existing = await getCompetencyBasic(id)
    if (!existing) {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 })
    }

    // Prevent circular references
    if (body.parentId === id) {
      return NextResponse.json(
        { error: 'A competency cannot be its own parent' },
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

    const competency = await updateCompetency(id, {
      name: body.name,
      description: body.description !== undefined ? body.description : existing.description,
      parentId: body.parentId !== undefined ? body.parentId : existing.parentId,
      level: body.level,
      residencyYear: body.residencyYear !== undefined ? (body.residencyYear ? parseInt(body.residencyYear) : null) : existing.residencyYear,
      displayOrder: body.displayOrder !== undefined ? parseInt(body.displayOrder) : existing.displayOrder,
    })

    return NextResponse.json({ competency })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error updating competency:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // All auth checks removed
    const { id } = await params

    await deleteCompetency(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    if (error instanceof Error && error.message.includes('Cannot delete')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error deleting competency:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

