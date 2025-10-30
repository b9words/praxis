import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const residency = await prisma.userResidency.findUnique({
      where: { userId: user.id },
    })

    if (!residency) {
      // Return default if not set
      return NextResponse.json({
        residency: {
          userId: user.id,
          currentResidency: 1,
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({ residency })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching residency:', error)
    return NextResponse.json({ error: 'Failed to fetch residency' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { currentResidency } = body

    if (typeof currentResidency !== 'number' || currentResidency < 1 || currentResidency > 5) {
      return NextResponse.json(
        { error: 'Invalid residency value. Must be between 1 and 5' },
        { status: 400 }
      )
    }

    const residency = await prisma.userResidency.upsert({
      where: { userId: user.id },
      update: {
        currentResidency,
      },
      create: {
        userId: user.id,
        currentResidency,
      },
    })

    return NextResponse.json({ residency })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating residency:', error)
    return NextResponse.json({ error: 'Failed to update residency' }, { status: 500 })
  }
}

