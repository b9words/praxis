import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const simulation = await prisma.simulation.findUnique({
      where: { id },
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
    console.error('Error fetching simulation:', error)
    return NextResponse.json({ error: 'Failed to fetch simulation' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Check ownership
    const existing = await prisma.simulation.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const simulation = await prisma.simulation.update({
      where: { id },
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
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating simulation:', error)
    return NextResponse.json({ error: 'Failed to update simulation' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Check ownership
    const existing = await prisma.simulation.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const simulation = await prisma.simulation.update({
      where: { id },
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
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating simulation:', error)
    return NextResponse.json({ error: 'Failed to update simulation' }, { status: 500 })
  }
}

