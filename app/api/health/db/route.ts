import { tableExists } from '@/lib/db/schemaGuard'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/health/db
 * Check database readiness
 */
export async function GET(request: NextRequest) {
  try {
    const checks = {
      profiles: await tableExists('profiles'),
      notifications: await tableExists('notifications'),
      userResidency: await tableExists('user_residency'),
      userLessonProgress: await tableExists('user_lesson_progress'),
      userArticleProgress: await tableExists('user_article_progress'),
      simulations: await tableExists('simulations'),
      debriefs: await tableExists('debriefs'),
    }

    const allOk = Object.values(checks).every(Boolean)
    const hints: string[] = []

    if (!checks.profiles) {
      hints.push('profiles table is missing - run migrations')
    }
    if (!checks.notifications) {
      hints.push('notifications table is missing - run migrations or use dev auto-create')
    }
    if (!checks.userResidency) {
      hints.push('user_residency table is missing - run migrations')
    }
    if (!checks.userLessonProgress) {
      hints.push('user_lesson_progress table is missing - run migrations')
    }
    if (!checks.userArticleProgress) {
      hints.push('user_article_progress table is missing - run migrations')
    }
    if (!checks.simulations) {
      hints.push('simulations table is missing - run migrations')
    }
    if (!checks.debriefs) {
      hints.push('debriefs table is missing - run migrations')
    }

    return NextResponse.json({
      ok: allOk,
      checks,
      hints,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

