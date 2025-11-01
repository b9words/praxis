import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  try {
    const user = await requireAuth()
    const { simulationId } = await params

    // Verify simulation ownership
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      select: { userId: true },
    })

    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (simulation.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const debrief = await prisma.debrief.findUnique({
      where: { simulationId },
      include: {
        simulation: {
          include: {
            case: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!debrief) {
      return NextResponse.json({ error: 'Debrief not found' }, { status: 404 })
    }

    return NextResponse.json({ debrief })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching debrief:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

