import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { seedComprehensiveData } from '@/lib/dev-seed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/dev/seed
 * Dev-only endpoint to seed comprehensive test data
 * Only available in non-production environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const email = body.email || user.email

    // Run comprehensive seed
    const results = await seedComprehensiveData(user.id, email)

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      results: {
        competencies: results.competencies,
        cases: results.cases,
        articles: results.articles,
        simulations: results.simulations,
        debriefs: results.debriefs,
        articleProgress: results.articleProgress,
        notifications: results.notifications,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    })
  } catch (error: any) {
    console.error('[dev/seed] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to seed data',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

