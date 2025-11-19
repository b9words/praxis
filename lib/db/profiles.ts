/**
 * Profiles repository
 * All profile database operations go through here
 */

import { dbCall, AppError, isColumnNotFoundError } from './utils'

/**
 * Ensure user profile exists, creating it if needed
 * Uses upsert to handle race conditions gracefully
 */
export async function ensureProfileExists(userId: string): Promise<boolean> {
  try {
    // Check if profile already exists
    const existing = await dbCall(async (prisma) => {
      return prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true },
      })
    })

    if (existing) {
      return true
    }

    // Try to get user data from Supabase (optional)
    let username = `user_${userId.slice(0, 8)}`
    let fullName: string | null = null
    let avatarUrl: string | null = null

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      
      if (sessionUser) {
        username = sessionUser.user_metadata?.username || 
                  sessionUser.user_metadata?.preferred_username ||
                  sessionUser.email?.split('@')[0] ||
                  username
        fullName = sessionUser.user_metadata?.full_name || 
                  sessionUser.user_metadata?.name || 
                  null
        avatarUrl = sessionUser.user_metadata?.avatar_url || 
                   sessionUser.user_metadata?.picture || 
                   null
      }
    } catch {
      // Session fetch failed - use defaults
    }

    // Upsert profile (create if not exists)
    await dbCall(async (prisma) => {
      return prisma.profile.upsert({
        where: { id: userId },
        update: {}, // No update if exists
        create: {
          id: userId,
          username,
          fullName,
          avatarUrl,
        },
      })
    })

    return true
  } catch {
    // If profile creation fails, return false
    // The caller can handle this gracefully
    return false
  }
}

/**
 * Get profile by ID
 * Only selects columns that definitely exist (excludes optional fields that may not exist)
 */
export async function getProfileById(id: string) {
  // Start with basic fields that always exist
  const basicSelect = {
    id: true,
    username: true,
    fullName: true,
    avatarUrl: true,
    bio: true,
    isPublic: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  }

  return dbCall(async (prisma) => {
    // Try to get basic fields first
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: basicSelect,
    })

    if (!profile) {
      return null
    }

    // Try to add optional fields if they exist (don't fail if they don't)
    // We'll check by trying to access them via a raw query or just return basic fields
    // For now, return basic fields - the optional fields will be null/undefined
    return profile
  }).catch((error: any) => {
    // If any error occurs, return null gracefully
    if (isColumnNotFoundError(error)) {
      return null
    }
    throw error
  })
}

/**
 * Get profile by username
 * Only selects columns that definitely exist
 */
export async function getProfileByUsername(username: string) {
  // Start with basic fields that always exist
  const basicSelect = {
    id: true,
    username: true,
    fullName: true,
    avatarUrl: true,
    bio: true,
    isPublic: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  }

  return dbCall(async (prisma) => {
    // Try with optional fields first
    try {
      return await prisma.profile.findUnique({
        where: { username },
        select: {
          ...basicSelect,
          weeklyTargetHours: true,
          learningTrack: true,
        },
      })
    } catch (error: any) {
      // If columns don't exist, retry with basic fields only
      if (isColumnNotFoundError(error)) {
        return await prisma.profile.findUnique({
          where: { username },
          select: basicSelect,
        })
      }
      throw error
    }
  }).catch((error: any) => {
    // If column doesn't exist (P2022), return null gracefully
    if (isColumnNotFoundError(error)) {
      return null
    }
    throw error
  })
}

/**
 * Get profile with role (for authorization)
 */
export async function getProfileWithRole(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })
  })
}

/**
 * Update profile role
 */
export async function updateProfileRole(userId: string, role: string) {
  return dbCall(async (prisma) => {
    return prisma.profile.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    })
  })
}

/**
 * Get user residency
 */
export async function getUserResidency(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.userResidency.findUnique({
      where: { userId },
      select: { currentResidency: true, focusCompetency: true },
    })
  })
}

/**
 * Get full user residency record
 */
export async function getUserResidencyFull(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.userResidency.findUnique({
      where: { userId },
      // UserResidency model is stable, all columns should exist
    })
  }).catch((error: any) => {
    // If column doesn't exist (P2022), return null gracefully
    if (isColumnNotFoundError(error)) {
      return null
    }
    throw error
  })
}

/**
 * Upsert user residency
 */
export async function upsertUserResidency(
  userId: string,
  currentResidency: number,
  focusCompetency?: string | null
) {
  return dbCall(async (prisma) => {
    const updateData: any = { currentResidency }
    const createData: any = { userId, currentResidency }

    if (focusCompetency !== undefined) {
      updateData.focusCompetency = focusCompetency
      createData.focusCompetency = focusCompetency
    }

    return prisma.userResidency.upsert({
      where: { userId },
      update: updateData,
      create: createData,
    })
  })
}

/**
 * Update profile (full update)
 */
export async function updateProfile(
  userId: string,
  data: {
    username?: string
    fullName?: string
    avatarUrl?: string
    bio?: string
    isPublic?: boolean
    weeklyTargetHours?: number | null
    learningTrack?: string | null
  }
) {
  const updateData: any = {}
  if (data.username !== undefined) updateData.username = data.username
  if (data.fullName !== undefined) updateData.fullName = data.fullName
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl
  if (data.bio !== undefined) updateData.bio = data.bio
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
  if (data.weeklyTargetHours !== undefined) updateData.weeklyTargetHours = data.weeklyTargetHours
  if (data.learningTrack !== undefined) updateData.learningTrack = data.learningTrack

  // Basic select fields that always exist
  const basicSelect = {
    id: true,
    username: true,
    fullName: true,
    avatarUrl: true,
    bio: true,
    isPublic: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  }

  return dbCall(async (prisma) => {
    // Try with optional fields first
    try {
      return await prisma.profile.update({
        where: { id: userId },
        data: updateData,
        select: {
          ...basicSelect,
          weeklyTargetHours: true,
          learningTrack: true,
        },
      })
    } catch (error: any) {
      // If columns don't exist in select, retry with basic fields only
      if (isColumnNotFoundError(error)) {
        // Remove optional fields from updateData if they don't exist in DB
        const safeUpdateData = { ...updateData }
        delete safeUpdateData.weeklyTargetHours
        delete safeUpdateData.learningTrack
        delete safeUpdateData.emailNotificationsEnabled
        
        return await prisma.profile.update({
          where: { id: userId },
          data: safeUpdateData,
          select: basicSelect,
        })
      }
      throw error
    }
  }).catch((error: any) => {
    // If column doesn't exist (P2022), filter out problematic columns and retry
    if (isColumnNotFoundError(error)) {
      const safeUpdateData = { ...updateData }
      delete safeUpdateData.emailNotificationsEnabled
      delete safeUpdateData.weeklyTargetHours
      delete safeUpdateData.learningTrack
      
      return dbCall(async (prisma) => {
        return prisma.profile.update({
          where: { id: userId },
          data: safeUpdateData,
          select: basicSelect,
        })
      })
    }
    throw error
  })
}

/**
 * Partial update profile (for PATCH operations)
 */
export async function partialUpdateProfile(
  userId: string,
  data: Record<string, any>
) {
  // Filter out emailNotificationsEnabled as it may not exist
  const { emailNotificationsEnabled, ...updateData } = data

  return dbCall(async (prisma) => {
    return prisma.profile.update({
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
  }).catch((error: any) => {
    // If column doesn't exist (P2022), filter out problematic columns and retry
    if (isColumnNotFoundError(error)) {
      const safeUpdateData = { ...updateData }
      delete safeUpdateData.emailNotificationsEnabled
      return dbCall(async (prisma) => {
        return prisma.profile.update({
          where: { id: userId },
          data: safeUpdateData,
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
      })
    }
    throw error
  })
}

