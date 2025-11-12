import { getCurrentUser } from '@/lib/auth/get-user'
import { getSimulationState, updateSimulationState, verifySimulationOwnership } from '@/lib/db/simulations'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const { caseId } = await params
    const body = await request.json()

    const { stageStates, currentStageId, eventLog } = body

    // Verify case study ownership
    const isOwner = await verifySimulationOwnership(caseId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update case study state in userInputs JSONB field
    await updateSimulationState(caseId, {
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
    console.error('Error saving case study state:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const { caseId } = await params

    // Verify case study ownership
    const isOwner = await verifySimulationOwnership(caseId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get case study state
    const simulation = await getSimulationState(caseId)
    if (!simulation) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 })
    }

    // Extract state from userInputs
    const state = (simulation.userInputs || {}) as any

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
    console.error('Error fetching case study state:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

