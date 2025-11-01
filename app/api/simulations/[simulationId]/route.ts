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

    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        case: true,
        debrief: true,
      },
    })

    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    // Users can only access their own simulations
    if (simulation.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ simulation })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching simulation:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  try {
    const user = await requireAuth()
    const { simulationId } = await params
    const body = await request.json()

    // Check ownership
    const existing = await prisma.simulation.findUnique({
      where: { id: simulationId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const simulation = await prisma.simulation.update({
      where: { id: simulationId },
      data: body,
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ simulation })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating simulation:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  try {
    const user = await requireAuth()
    const { simulationId } = await params
    const body = await request.json()

    // Check ownership
    const existing = await prisma.simulation.findUnique({
      where: { id: simulationId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const simulation = await prisma.simulation.update({
      where: { id: simulationId },
      data: body,
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ simulation })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating simulation:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}
