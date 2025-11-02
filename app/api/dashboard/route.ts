import { getCurrentUser } from '@/lib/auth/get-user'
import { assembleDashboardData } from '@/lib/dashboard-assembler'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getCachedUserData, CacheTags } from '@/lib/cache'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 300 // 5 minutes

/**
 * API route for dashboard data - uses shared assembler to avoid duplication
 * This is a thin façade over lib/dashboard-assembler.ts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: 30 requests per minute per user
    const ip = getClientIp(request)
    const rateLimitResult = checkRateLimit(user.id, ip, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    // Cache dashboard data per user (5 minutes revalidate, userId in key)
    const getCachedDashboardData = getCachedUserData(
      user.id,
      () => assembleDashboardData(user.id),
      ['dashboard', 'api'],
      {
        tags: [CacheTags.DASHBOARD, CacheTags.USER_PROGRESS],
        revalidate: 300, // 5 minutes
      }
    )

    // Use shared assembler - single source of truth
    const dashboardData = await getCachedDashboardData()

    // Return complete dashboard data for API consumers
    // This BFF endpoint aggregates all dashboard shelves in a single optimized call
    return NextResponse.json(
      {
        recommendation: dashboardData.recommendation,
        residencyData: dashboardData.residencyData,
        currentStreak: dashboardData.currentStreak,
        recentActivities: dashboardData.recentActivities,
        aggregateScores: dashboardData.aggregateScores,
        jumpBackInItems: dashboardData.jumpBackInItems,
        strengthenCoreShelves: dashboardData.strengthenCoreShelves,
        newContent: dashboardData.newContent,
        popularContent: dashboardData.popularContent,
        practiceSpotlight: dashboardData.practiceSpotlight,
        continueYearPath: dashboardData.continueYearPath,
        themedCollections: dashboardData.themedCollections,
        moduleCollections: dashboardData.moduleCollections,
        learningPaths: dashboardData.learningPaths,
      },
      {
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
        }
      }
    )
  } catch (error: any) {
    const { createErrorResponse } = await import('@/lib/api/error-wrapper')
    return createErrorResponse(error, {
      defaultMessage: 'Failed to load dashboard data',
      statusCode: 500,
    })
  }
}

