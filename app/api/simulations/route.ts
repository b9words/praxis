import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const caseId = searchParams.get('caseId')

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }
    if (caseId) {
      where.caseId = caseId
    }

    const simulations = await prisma.simulation.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
        debrief: {
          select: {
            id: true,
            scores: true,
            summaryText: true,
            radarChartData: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ simulations })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching simulations:', error)
    return NextResponse.json({ error: 'Failed to fetch simulations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { caseId, userInputs = {} } = body

    if (!caseId) {
      return NextResponse.json({ error: 'Missing caseId' }, { status: 400 })
    }

    // Check if simulation already exists
    const existing = await prisma.simulation.findFirst({
      where: {
        userId: user.id,
        caseId,
      },
    })

    if (existing) {
      return NextResponse.json({ simulation: existing }, { status: 200 })
    }

    const simulation = await prisma.simulation.create({
      data: {
        userId: user.id,
        caseId,
        userInputs,
        status: 'in_progress',
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ simulation }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error creating simulation:', error)
    return NextResponse.json({ error: 'Failed to create simulation' }, { status: 500 })
  }
}

