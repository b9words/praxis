import { logOnce } from '@/lib/monitoring';
import { prisma } from '@/lib/prisma/server';
import { getCurrentUser } from './get-user';
import { getCurrentBriefing } from '@/lib/briefing';
import { checkSubscription } from './require-subscription';
import { getModuleById } from '@/lib/curriculum-data';

export type UserRole = 'member' | 'editor' | 'admin'

/**
 * Ensure profile exists for a user
 * Creates profile via Supabase admin (FK-safe) with retry
 * Returns minimal profile if creation fails (never throws)
 */
export async function ensureProfileExists(
  userId: string,
  email?: string
): Promise<{ id: string; role: UserRole } | null> {
  try {
    // Check if profile already exists
    let profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })
    
    if (profile) {
      return { id: profile.id, role: profile.role as UserRole }
    }

    // Get username from Supabase user metadata
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    
    const usernameFromMetadata = supabaseUser?.user_metadata?.username
    const emailPrefix = email?.split('@')[0] || ''
    
    let username = usernameFromMetadata || emailPrefix || `user_${userId.slice(0, 8)}`
    username = username.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
    if (!username || username.length < 3) {
      username = `user_${userId.slice(0, 8)}`
    }
    
    const uniqueUsername = `${username}_${userId.slice(0, 8)}`
    const fullNameValue = supabaseUser?.user_metadata?.full_name || 
                         supabaseUser?.user_metadata?.fullName ||
                         emailPrefix || null
    const avatarUrlValue = supabaseUser?.user_metadata?.avatar_url || 
                          supabaseUser?.user_metadata?.avatarUrl || null
    const roleValue = (supabaseUser?.user_metadata?.role as UserRole) || 'member'
    
    // Use Supabase admin client to create profile (FK-safe)
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (serviceRoleKey && supabaseUrl) {
      const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      
      // Retry up to 3 times
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            username: uniqueUsername,
            full_name: fullNameValue,
            avatar_url: avatarUrlValue,
            role: roleValue,
            is_public: false,
          }, { onConflict: 'id' })
        
        if (profileError) {
          logOnce(`profile_creation_${userId}`, 'error', 'Failed to create profile', {
            attempt: attempt + 1,
            error: profileError.message,
            userId,
          })
          
          if (attempt === 2) {
            return null // Failed after retries
          }
          
          await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)))
          continue
        }
        
        // Wait for profile to be available via Prisma
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Try to fetch the created profile
        profile = await prisma.profile.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        })
        
        if (profile) {
          return { id: profile.id, role: profile.role as UserRole }
        }
      }
      
      return null // Failed to create after retries
    }
    
    // Fallback: try Prisma directly (may fail on FK)
    try {
      await prisma.profile.create({
        data: {
          id: userId,
          username: uniqueUsername,
          fullName: fullNameValue,
          avatarUrl: avatarUrlValue,
          role: roleValue,
        },
        select: {
          id: true,
        },
      })
      
      profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      })
      
      if (profile) {
        return { id: profile.id, role: profile.role as UserRole }
      }
    } catch (prismaError: any) {
      // Handle missing columns (P2022) or FK errors
      if (prismaError.code === 'P2022' || prismaError.message?.includes('does not exist')) {
        // Column doesn't exist - try with minimal data
        try {
          await prisma.profile.create({
            data: {
              id: userId,
              username: uniqueUsername,
              role: roleValue,
            },
            select: {
              id: true,
            },
          })
          
          profile = await prisma.profile.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
          })
          
          if (profile) {
            return { id: profile.id, role: profile.role as UserRole }
          }
        } catch (fallbackError: any) {
          // Ignore if profile already exists
          if (fallbackError.code === 'P2002') {
            profile = await prisma.profile.findUnique({
              where: { id: userId },
              select: { id: true, role: true },
            })
            if (profile) {
              return { id: profile.id, role: profile.role as UserRole }
            }
          }
          logOnce(`profile_creation_prisma_fallback_${userId}`, 'error', 'Prisma profile creation fallback failed', {
            code: fallbackError.code,
            userId,
          })
        }
      } else if (prismaError.code !== 'P2002' && prismaError.code !== 'P2010') {
        logOnce(`profile_creation_prisma_${userId}`, 'error', 'Prisma profile creation failed', {
          code: prismaError.code,
          userId,
        })
      }
    }
    
    return null
  } catch (error: any) {
    logOnce(`profile_creation_exception_${userId}`, 'error', 'Exception in ensureProfileExists', {
      error: error.message,
      userId,
    })
    return null
  }
}

/**
 * Check if the current user has the required role
 */
export async function requireRole(requiredRole: UserRole | UserRole[]): Promise<{ id: string; role: UserRole }> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  })

  if (!profile) {
    throw new Error('Profile not found')
  }

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  const userRole = profile.role as UserRole

  // Role hierarchy: admin > editor > member
  const roleHierarchy: Record<UserRole, number> = {
    member: 1,
    editor: 2,
    admin: 3,
  }

  const hasRequiredRole = requiredRoles.some((role) => roleHierarchy[userRole] >= roleHierarchy[role])

  if (!hasRequiredRole) {
    throw new Error('Forbidden')
  }

  return { id: profile.id, role: userRole }
}

/**
 * Check if user is authenticated
 * Creates profile if it doesn't exist (for backwards compatibility)
 */
export async function requireAuth(): Promise<{ id: string; role: UserRole }> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  let profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  })

  // Auto-create profile if it doesn't exist (backwards compatibility)
  if (!profile) {
    const createdProfile = await ensureProfileExists(user.id, user.email || undefined)
    if (createdProfile) {
      profile = { id: createdProfile.id, role: createdProfile.role }
    }
  }

  if (!profile) {
    // Never throw - return minimal profile structure
    return { id: user.id, role: 'member' as UserRole }
  }

  return { id: profile.id, role: profile.role as UserRole }
}

export interface PublicAccessStatus {
  access: boolean
  isPublic?: boolean
  requiresLogin?: boolean
}

/**
 * Check if content is publicly accessible (weekly briefing)
 * Returns access status for lessons or cases based on weekly briefing schedule
 */
export async function getPublicAccessStatus(
  userId: string | null,
  target: {
    type: 'lesson'
    domainId: string
    moduleId: string
    lessonId: string
  } | {
    type: 'case'
    caseId: string
  }
): Promise<PublicAccessStatus> {
  // Check if user has active subscription
  if (userId) {
    const subscriptionStatus = await checkSubscription()
    if (subscriptionStatus.isActive) {
      return { access: true }
    }
  }

  // Get current briefing
  const briefing = await getCurrentBriefing()
  if (!briefing) {
    return { access: false }
  }

  // Check lesson access
  if (target.type === 'lesson') {
    // Must match current briefing module
    if (target.domainId !== briefing.domainId || target.moduleId !== briefing.moduleId) {
      return { access: false }
    }

    // Get module to find first lesson
    const module = getModuleById(target.domainId, target.moduleId)
    if (!module || !module.lessons || module.lessons.length === 0) {
      // Defensive: module doesn't exist or has no lessons
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[getPublicAccessStatus] Module ${target.moduleId} not found or has no lessons`)
      }
      return { access: false }
    }

    const firstLessonId = module.lessons[0]?.id

    // Anonymous users: only first lesson
    if (!userId) {
      if (target.lessonId === firstLessonId) {
        return { access: true, isPublic: true }
      }
      return { access: false, requiresLogin: true }
    }

    // Logged-in non-subscribers: all lessons in module
    return { access: true, isPublic: true }
  }

  // Check case access
  if (target.type === 'case') {
    // Must match current briefing case
    if (target.caseId !== briefing.caseId) {
      return { access: false }
    }

    // Anonymous users: require login
    if (!userId) {
      return { access: false, requiresLogin: true }
    }

    // Logged-in non-subscribers: allow access
    return { access: true, isPublic: true }
  }

  return { access: false }
}

