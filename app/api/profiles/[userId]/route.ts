import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    // Cache profile (5 minutes revalidate, userId in key)
    const getCachedProfile = cache(
      async () => {
        const profile = await prisma.profile.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            isPublic: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        if (!profile) {
          return null
        }

        // Check if profile is public or user is viewing their own profile
        let currentUser = null
        try {
          const { getCurrentUser } = await import('@/lib/auth/get-user')
          currentUser = await getCurrentUser()
        } catch {
          // User not authenticated, that's OK
        }
        const isOwnProfile = currentUser && currentUser.id === userId

        if (!profile.isPublic && !isOwnProfile) {
          return { error: 'Profile is private', status: 403 }
        }

        return profile
      },
      ['api', 'profile', userId],
      {
        tags: [CacheTags.USERS, `user-${userId}`],
        revalidate: 300, // 5 minutes
      }
    )

    const result = await getCachedProfile()

    if (result === null) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (result && 'error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({ profile: result })
  } catch (error) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const { userId } = await params

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { username, fullName, avatarUrl, bio, isPublic } = body

    let profile
    try {
      profile = await prisma.profile.update({
        where: { id: userId },
        data: {
          username,
          fullName,
          avatarUrl,
          bio,
          isPublic,
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
          isPublic: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    } catch (error: any) {
      // Handle missing columns (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: same update but Prisma will handle missing columns
          profile = await prisma.profile.update({
            where: { id: userId },
            data: {
              username,
              fullName,
              avatarUrl,
              bio,
              isPublic,
            },
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              bio: true,
              isPublic: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        } catch (fallbackError) {
          console.error('Error updating profile (fallback):', fallbackError)
          throw fallbackError
        }
      } else {
        throw error
      }
    }

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const { userId } = await params
    const body = await request.json()

    // Allow admins to update any profile, users can only update their own
    const isAdmin = user.role === 'admin'
    const isUpdatingRole = body.role && body.role !== user.role

    if (!isAdmin && user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only admins can update roles
    if (isUpdatingRole && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can update roles' }, { status: 403 })
    }

    // Filter out emailNotificationsEnabled as it may not exist in all database instances
    const { emailNotificationsEnabled, ...updateData } = body

    let profile
    try {
      profile = await prisma.profile.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
          isPublic: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    } catch (error: any) {
      // Handle missing columns (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: same update but Prisma will handle missing columns
          profile = await prisma.profile.update({
            where: { id: userId },
            data: updateData,
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              bio: true,
              isPublic: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        } catch (fallbackError) {
          console.error('Error updating profile (fallback):', fallbackError)
          throw fallbackError
        }
      } else {
        throw error
      }
    }

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

