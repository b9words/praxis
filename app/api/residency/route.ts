import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    let residency
    try {
      residency = await prisma.userResidency.findUnique({
        where: { userId: user.id },
      })
    } catch (error: any) {
      // Handle missing table (P2021) or missing columns (P2022)
      if (error?.code === 'P2021' || error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        // Table doesn't exist, return default
        return NextResponse.json({
          residency: {
            userId: user.id,
            currentResidency: 1,
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
      }
      throw error
    }

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
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching residency:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const body = await request.json()

    const { currentResidency } = body

    if (typeof currentResidency !== 'number' || currentResidency < 1 || currentResidency > 5) {
      return NextResponse.json(
        { error: 'Invalid residency value. Must be between 1 and 5' },
        { status: 400 }
      )
    }

    let residency
    try {
      residency = await prisma.userResidency.upsert({
        where: { userId: user.id },
        update: {
          currentResidency,
        },
        create: {
          userId: user.id,
          currentResidency,
        },
      })
    } catch (error: any) {
      // Handle missing table (P2021) or missing columns (P2022)
      if (error?.code === 'P2021' || error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Residency feature is not available' },
          { status: 503 }
        )
      }
      throw error
    }

    // Set cookie to bypass residency check on dashboard after redirect
    // This ensures the cookie is set server-side and will be available immediately
    const response = NextResponse.json({ residency })
    response.cookies.set('onboarding_complete', '1', {
      path: '/',
      maxAge: 30, // 30 seconds
      sameSite: 'lax',
      httpOnly: false, // Must be accessible to client-side JS for backup checks
    })

    return response
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating residency:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

