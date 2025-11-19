import { getCurrentUser } from '@/lib/auth/get-user'
import { updateProfile, ensureProfileExists, upsertUserResidency } from '@/lib/db/profiles'
import { AppError } from '@/lib/db/utils'
import { getDomainById } from '@/lib/curriculum-data'
import { serverAnalyticsTracker } from '@/lib/analytics'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null
  let body: any = null
  
  try {
    user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    body = await request.json()
    const { strategicObjective, competencyId, weeklyTimeCommitment, selectedTrack } = body

    if (!strategicObjective || !competencyId) {
      return NextResponse.json(
        { error: 'strategicObjective and competencyId are required' },
        { status: 400 }
      )
    }

    // Validate competencyId is a valid domainId
    const domain = getDomainById(competencyId)
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid competencyId: domain not found' },
        { status: 400 }
      )
    }

    // Update user's profile with onboarding data
    // Store strategic objective in bio field
    try {
      await updateProfile(user.id, {
        bio: strategicObjective,
        weeklyTargetHours: weeklyTimeCommitment || null,
        learningTrack: selectedTrack || null,
      })
    } catch (error: any) {
      // Handle case where profile doesn't exist yet
      if (error instanceof AppError && error.statusCode === 404) {
        // Profile doesn't exist, create it
        await ensureProfileExists(user.id)
        // Retry the update
        await updateProfile(user.id, {
          bio: strategicObjective,
          weeklyTargetHours: weeklyTimeCommitment || null,
          learningTrack: selectedTrack || null,
        })
      } else {
        throw error
      }
    }

    // Set user residency to Year 1 and store focus competency
    await upsertUserResidency(user.id, 1, competencyId)

    // Track onboarding completion
    try {
      await serverAnalyticsTracker.track('onboarding_completed', {
        userId: user.id,
        strategicObjective,
        competencyId,
        weeklyTimeCommitment: weeklyTimeCommitment || null,
        selectedTrack: selectedTrack || null,
      })
    } catch (analyticsError) {
      // Don't fail onboarding if analytics fails
      console.error('Failed to track onboarding completion:', analyticsError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding data saved successfully'
    })
  } catch (error: any) {
    // Log to Sentry with context
    Sentry.captureException(error, {
      tags: {
        route: '/api/onboarding',
        operation: 'save_onboarding',
      },
      extra: {
        userId: user?.id,
        hasStrategicObjective: !!body.strategicObjective,
        hasCompetencyId: !!body.competencyId,
      },
    })
    
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error saving onboarding data:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

