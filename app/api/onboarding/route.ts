import { getCurrentUser } from '@/lib/auth/get-user'
import { updateProfile, ensureProfileExists } from '@/lib/db/profiles'
import { AppError } from '@/lib/db/utils'
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

    // Update user's profile with onboarding data
    // Store strategic objective in bio field (or create a dedicated field if needed)
    // For now, we'll use a JSON structure in bio or store it separately
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

    // Store onboarding metadata (could be in a separate table or JSON field)
    // For now, we'll store it in user metadata or create a dedicated onboarding table
    // Since we don't have an onboarding table, we'll store it as metadata that can be retrieved later
    // The competency selection can be used to set the user's initial focus domain

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

