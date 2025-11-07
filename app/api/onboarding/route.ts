import { getCurrentUser } from '@/lib/auth/get-user'
import { updateProfile, ensureProfileExists, upsertUserResidency } from '@/lib/db/profiles'
import { AppError } from '@/lib/db/utils'
import { getDomainById } from '@/lib/curriculum-data'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { strategicObjective, competencyId } = body

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
      })
    } catch (error: any) {
      // Handle case where profile doesn't exist yet
      if (error instanceof AppError && error.statusCode === 404) {
        // Profile doesn't exist, create it
        await ensureProfileExists(user.id)
        // Retry the update
        await updateProfile(user.id, {
          bio: strategicObjective,
        })
      } else {
        throw error
      }
    }

    // Set user residency to Year 1 and store focus competency
    await upsertUserResidency(user.id, 1, competencyId)

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding data saved successfully'
    })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error saving onboarding data:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

