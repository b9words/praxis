
import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
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
        const competency = await prisma.competency.findUnique({
          where: { id },
          include: {
            parent: true,
            children: true,
            articles: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        })
        return competency
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
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching competency:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
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
    const existing = await prisma.competency.findUnique({
      where: { id },
    })

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
      const parent = await prisma.competency.findUnique({
        where: { id: body.parentId },
      })
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent competency not found' },
          { status: 404 }
        )
      }
    }

    const competency = await prisma.competency.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description !== undefined ? body.description : existing.description,
        parentId: body.parentId !== undefined ? body.parentId : existing.parentId,
        level: body.level,
        residencyYear: body.residencyYear !== undefined ? (body.residencyYear ? parseInt(body.residencyYear) : null) : existing.residencyYear,
        displayOrder: body.displayOrder !== undefined ? parseInt(body.displayOrder) : existing.displayOrder,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    return NextResponse.json({ competency })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating competency:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // All auth checks removed
    const { id } = await params

    // Check if competency exists
    const existing = await prisma.competency.findUnique({
      where: { id },
      include: {
        children: true,
        articles: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Competency not found' }, { status: 404 })
    }

    // Check for dependencies
    if (existing.children && existing.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete competency with child competencies. Delete children first.' },
        { status: 400 }
      )
    }

    if (existing.articles && existing.articles.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete competency with associated articles. Remove articles first.' },
        { status: 400 }
      )
    }

    await prisma.competency.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error deleting competency:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

