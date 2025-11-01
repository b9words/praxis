import { ensureProfileExists } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
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
    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        username: true,
        fullName: true,
        isPublic: true,
      },
    })

    // If profile doesn't exist, try to create it (non-blocking)
    if (!profile) {
      const createdProfile = await ensureProfileExists(user.id, user.email || undefined)
      
      if (createdProfile) {
        // Fetch full profile after creation
        profile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            username: true,
            fullName: true,
            isPublic: true,
          },
        })
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
