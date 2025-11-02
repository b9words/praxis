import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
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

    let debrief: any = null
    try {
      debrief = await prisma.debrief.findUnique({
        where: { simulationId },
        include: {
          simulation: {
            include: {
                  case: {
                    select: {
                      id: true,
                      title: true,
                      rubric: true,
                    },
                  },
            },
          },
        },
      })
    } catch (error: any) {
      // Handle missing rubric_version column (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
          debrief = await prisma.debrief.findUnique({
            where: { simulationId },
            select: {
              id: true,
              simulationId: true,
              scores: true,
              summaryText: true,
              radarChartData: true,
              createdAt: true,
              updatedAt: true,
              simulation: {
                select: {
                  id: true,
                  case: {
                    select: {
                      id: true,
                      title: true,
                      rubric: true,
                    },
                  },
                },
              },
            },
          })
        } catch (fallbackError) {
          console.error('Error fetching debrief (fallback):', fallbackError)
        }
      } else {
        throw error
      }
    }

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

