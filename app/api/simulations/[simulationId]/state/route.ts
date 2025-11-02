import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
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
    try {
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
    } catch (updateError: any) {
      // Handle P2025 (record not found) or any other Prisma errors
      if (updateError?.code === 'P2025') {
        return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
      }
      
      const { normalizeError } = await import('@/lib/api/route-helpers')
      const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
      const normalized = normalizeError(updateError)
      const statusCode = getPrismaErrorStatusCode(updateError)
      console.error('Error updating simulation state:', updateError)
      return NextResponse.json({ error: normalized }, { status: statusCode })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error saving simulation state:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
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
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching simulation state:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

