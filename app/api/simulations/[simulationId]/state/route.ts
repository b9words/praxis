import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  try {
    const user = await requireAuth()
    const { simulationId } = await params
    const body = await request.json()

    const { stageStates, currentStageId, eventLog } = body

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

    // Update simulation state in userInputs JSONB field
    await prisma.simulation.update({
      where: { id: simulationId },
      data: {
        userInputs: {
          stageStates: stageStates || {},
          currentStageId: currentStageId || null,
          eventLog: eventLog || [],
          lastSaved: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error saving simulation state:', error)
    return NextResponse.json({ error: 'Failed to save simulation state' }, { status: 500 })
  }
}

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
      select: { userId: true, userInputs: true },
    })

    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (simulation.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Extract state from userInputs
    const state = simulation.userInputs as any

    return NextResponse.json({
      stageStates: state?.stageStates || {},
      currentStageId: state?.currentStageId || null,
      eventLog: state?.eventLog || [],
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching simulation state:', error)
    return NextResponse.json({ error: 'Failed to fetch simulation state' }, { status: 500 })
  }
}

