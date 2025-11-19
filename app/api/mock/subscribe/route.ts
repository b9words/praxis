import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Only allow in development or when explicitly enabled for testing
  const isDevelopment = process.env.NODE_ENV === 'development'
  const mockCheckoutEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_CHECKOUT === 'true'
  
  // Block in production unless explicitly enabled (for staging/testing)
  if (!isDevelopment && !mockCheckoutEnabled) {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    )
  }
  
  // Additional safety: require explicit enable flag even in development for production-like testing
  if (!mockCheckoutEnabled) {
    return NextResponse.json(
      { error: 'Mock checkout is disabled. Set NEXT_PUBLIC_ENABLE_MOCK_CHECKOUT=true to enable.' },
      { status: 403 }
    )
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planName } = body

    // Best-effort: Create or update subscription in database
    try {
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + 30) // 30 days from now

      // Use a mock paddle subscription ID
      const mockPaddleSubscriptionId = `mock_sub_${user.id}_${Date.now()}`
      const mockPaddlePlanId = planName === 'Explorer' 
        ? 'mock_explorer'
        : planName === 'Professional'
        ? 'mock_professional'
        : 'mock_executive'

      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          paddlePlanId: mockPaddlePlanId,
        },
        create: {
          id: `mock_${user.id}_${Date.now()}`,
          userId: user.id,
          paddleSubscriptionId: mockPaddleSubscriptionId,
          paddlePlanId: mockPaddlePlanId,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })
    } catch (error: any) {
      // Best-effort: if DB fails, continue anyway (cookie will still work)
      if (!isMissingTable(error)) {
        console.error('Error creating mock subscription in DB:', error)
      }
      // Continue - cookie will still be set
    }

    // Always set cookie to mark user as subscribed
    const response = NextResponse.json({ success: true })
    response.cookies.set('mock_subscribed', '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      httpOnly: false, // Must be accessible to client-side for checks
    })

    return response
  } catch (error: any) {
    console.error('Error in mock subscribe:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


