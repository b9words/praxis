import { getCurrentUser } from '@/lib/auth/get-user'
import { getSimulationState, updateSimulationState, verifySimulationOwnership } from '@/lib/db/simulations'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
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
    const body = await request.json()

    const { stageStates, currentStageId, eventLog } = body

    // Verify simulation ownership
    const isOwner = await verifySimulationOwnership(simulationId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update simulation state in userInputs JSONB field
    await updateSimulationState(simulationId, {
      stageStates,
      currentStageId,
      eventLog,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error saving simulation state:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

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
    const isOwner = await verifySimulationOwnership(simulationId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get simulation state
    const simulation = await getSimulationState(simulationId)
    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    // Extract state from userInputs
    const state = simulation.userInputs as any

    return NextResponse.json({
      stageStates: state?.stageStates || {},
      currentStageId: state?.currentStageId || null,
      eventLog: state?.eventLog || [],
    })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching simulation state:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

