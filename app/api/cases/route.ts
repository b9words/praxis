import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const cases = await prisma.case.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        competencies: {
          include: {
            competency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ cases })
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['editor', 'admin'])
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

    const caseItem = await prisma.case.create({
      data: {
        title,
        briefingDoc: briefingDoc || null,
        description,
        datasets: datasets || null,
        rubric,
        status,
        difficulty,
        estimatedMinutes,
        prerequisites: prerequisites || [],
        storagePath,
        metadata: metadata || {},
        createdBy: user.id,
        updatedBy: user.id,
        competencies: {
          create: competencyIds.map((compId: string) => ({
            competencyId: compId,
          })),
        },
      },
      include: {
        competencies: {
          include: {
            competency: true,
          },
        },
      },
    })

    return NextResponse.json({ case: caseItem }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error creating case:', error)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }
}

