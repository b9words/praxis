import { ensureProfileExists } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getProfileById } from '@/lib/db/profiles'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/profile
 * Get current user's profile for permission checks
 * Never returns 500 - always returns minimal profile if needed
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ 
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } 
      }, { status: 401 })
    }

    // Try to get profile
    let profile = await getProfileById(user.id).catch(() => null)
    
    if (profile) {
      // Map to expected format
      profile = {
        id: profile.id,
        role: profile.role,
        username: profile.username,
        fullName: profile.fullName,
        isPublic: profile.isPublic,
      } as any
    }

    // If profile doesn't exist, try to create it (non-blocking)
    if (!profile) {
      const createdProfile = await ensureProfileExists(user.id, user.email || undefined)
      
      if (createdProfile) {
        // Fetch full profile after creation
        const fullProfile = await getProfileById(user.id).catch(() => null)
        if (fullProfile) {
          profile = {
            id: fullProfile.id,
            role: fullProfile.role,
            username: fullProfile.username,
            fullName: fullProfile.fullName,
            isPublic: fullProfile.isPublic,
          } as any
        }
      }
    }

    // Return profile or minimal structure - never 500
    if (profile) {
      return NextResponse.json({ profile })
    }
    
    // Return minimal profile structure
    return NextResponse.json({ 
      profile: {
        id: user.id,
        role: 'member',
        username: null,
        fullName: null,
        isPublic: false,
      }
    })
  } catch (error) {
    console.error('Error in /api/auth/profile:', error)
    // Always return 200 with minimal profile - never crash
    try {
      const user = await getCurrentUser()
      return NextResponse.json({ 
        profile: user ? {
          id: user.id,
          role: 'member' as const,
          username: null,
          fullName: null,
          isPublic: false,
        } : null
      })
    } catch {
      return NextResponse.json({ profile: null })
    }
  }
}
