import { getCurrentUser } from '@/lib/auth/get-user'
import { getUserResidencyFull, upsertUserResidency } from '@/lib/db/profiles'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    const residency = await getUserResidencyFull(user.id).catch(() => null)

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
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching residency:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
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

    const residency = await upsertUserResidency(user.id, currentResidency)

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
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error updating residency:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

