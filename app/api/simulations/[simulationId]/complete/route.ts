import { requireAuth } from '@/lib/auth/authorize'
import { notifySimulationComplete } from '@/lib/notifications/triggers'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/simulations/[simulationId]/complete
 * Complete a simulation and trigger side effects:
 * - Generate debrief
 * - Create forum thread (if enabled)
 * - Send notifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  try {
    const user = await requireAuth()
    const { simulationId } = await params

    // Get simulation with case and user info
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (simulation.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (simulation.status === 'completed') {
      return NextResponse.json({ error: 'Simulation already completed' }, { status: 400 })
    }

    // Store case title before updating (needed after update when TypeScript loses type info)
    const caseTitle = simulation.case.title

    // Mark simulation as completed
    await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    // Create forum thread for this simulation (if forum channels exist)
    try {
      const generalChannel = await prisma.forumChannel.findFirst({
        where: { slug: 'general' },
      })

      if (generalChannel) {
        await prisma.forumThread.create({
          data: {
            channelId: generalChannel.id,
            title: `Discussion: ${caseTitle}`,
            content: `Completed simulation "${caseTitle}" and would love to discuss insights and learnings with the community!`,
            authorId: user.id,
            metadata: {
              simulationId: simulation.id,
              caseId: simulation.caseId,
              autoCreated: true,
            },
          },
        })
      }
    } catch (forumError) {
      // Don't fail the completion if forum thread creation fails
      console.error('Failed to create forum thread:', forumError)
    }

    // Send notification
    await notifySimulationComplete(
      user.id,
      simulation.id,
      caseTitle
    )

    return NextResponse.json({ success: true, simulationId })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error completing simulation:', error)
    return NextResponse.json({ error: 'Failed to complete simulation' }, { status: 500 })
  }
}

