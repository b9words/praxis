import { logOnce } from '@/lib/monitoring';
import { getCurrentUser } from './get-user';
import { getCurrentBriefing } from '@/lib/briefing';
import { checkSubscription } from './require-subscription';
import { getModuleById } from '@/lib/curriculum-data';
import { ensureProfileExists as ensureProfileExistsRepo, getProfileWithRole, updateProfileRole } from '@/lib/db/profiles';

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
    let profile = await getProfileWithRole(userId)
    
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
        profile = await getProfileWithRole(userId)
        
        if (profile) {
          return { id: profile.id, role: profile.role as UserRole }
        }
      }
      
      return null // Failed to create after retries
    }
    
    // Fallback: try repository function
    try {
      const created = await ensureProfileExistsRepo(userId)
      if (created) {
        profile = await getProfileWithRole(userId)
        if (profile) {
          return { id: profile.id, role: profile.role as UserRole }
        }
      }
    } catch (error: any) {
      logOnce(`profile_creation_repo_fallback_${userId}`, 'error', 'Repository profile creation fallback failed', {
        error: error.message,
        userId,
      })
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

  // Development mode bypass: if authenticated in dev, grant admin access immediately
  // This helps with dev tools testing where roles might not be set correctly
  if (process.env.NODE_ENV === 'development') {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const needsAdmin = requiredRoles.includes('admin')
    const needsEditor = requiredRoles.includes('editor')
    
    if (needsAdmin || needsEditor) {
      // Ensure profile exists and set to admin
      let profile = await getProfileWithRole(user.id)

      if (!profile) {
        const createdProfile = await ensureProfileExists(user.id, user.email || undefined)
        if (createdProfile) {
          profile = { id: createdProfile.id, role: createdProfile.role }
        } else {
          // Create minimal profile with admin role
          try {
            const created = await ensureProfileExistsRepo(user.id)
            if (created) {
              profile = await getProfileWithRole(user.id)
            }
            // If still no profile, try Supabase admin client
            if (!profile) {
              const { createClient: createAdminClient } = await import('@supabase/supabase-js')
              const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
              
              if (serviceRoleKey && supabaseUrl) {
                const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
                  auth: { autoRefreshToken: false, persistSession: false },
                })
                
                await supabaseAdmin.from('profiles').upsert({
                  id: user.id,
                  username: `dev_${user.id.slice(0, 8)}`,
                  role: 'admin',
                  is_public: false,
                }, { onConflict: 'id' })
                
                await new Promise(resolve => setTimeout(resolve, 200))
                profile = await getProfileWithRole(user.id) || { id: user.id, role: 'admin' as UserRole }
              } else {
                profile = { id: user.id, role: 'admin' as UserRole }
              }
            }
          } catch {
            // Fallback: return admin role anyway in dev mode
            return { id: user.id, role: 'admin' as UserRole }
          }
        }
      }

      // Update to admin if not already
      if (profile && profile.role !== 'admin') {
        try {
          await updateProfileRole(user.id, 'admin')
          profile.role = 'admin' as UserRole
        } catch {
          // If update fails, still grant access in dev mode
          profile.role = 'admin' as UserRole
        }
      }

      return { id: profile?.id || user.id, role: 'admin' as UserRole }
    }
  }

  // Check user_metadata first for role (useful for dev tools/manual overrides)
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  const metadataRole = supabaseUser?.user_metadata?.role as UserRole | undefined

  // Role hierarchy: admin > editor > member
  const roleHierarchy: Record<UserRole, number> = {
    member: 1,
    editor: 2,
    admin: 3,
  }

  // Validate metadata role is a valid UserRole
  const validRoles: UserRole[] = ['member', 'editor', 'admin']
  const isValidMetadataRole = metadataRole && validRoles.includes(metadataRole)

  let profile = await getProfileWithRole(user.id)

  // Auto-create profile if it doesn't exist (similar to requireAuth)
  // This handles cases where users are created via dev tools but profile doesn't exist yet
  if (!profile) {
    const createdProfile = await ensureProfileExists(user.id, user.email || undefined)
    if (createdProfile) {
      profile = { id: createdProfile.id, role: createdProfile.role }
    } else {
      throw new Error('Profile not found')
    }
  }

  // Use metadata role if it's valid and (higher than profile role OR in development mode)
  // In dev mode, always trust metadata role if set
  let userRole = profile.role as UserRole
  if (isValidMetadataRole) {
    const shouldUseMetadata = 
      process.env.NODE_ENV === 'development' || 
      roleHierarchy[metadataRole] >= roleHierarchy[userRole]
    
    if (shouldUseMetadata) {
      // Update profile to match metadata role (for consistency)
      try {
        await updateProfileRole(user.id, metadataRole)
        userRole = metadataRole
      } catch (updateError) {
        // If update fails, still use metadata role for this check
        userRole = metadataRole
      }
    }
  }

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
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

  let profile = await getProfileWithRole(user.id)

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
  requiresUpgrade?: boolean
  domainId?: string
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
  // Check if user is admin - admins always have access
  // Do this FIRST before any subscription checks
  if (userId) {
    let isAdmin = false
    let roleCheckError = false
    
    try {
      // First check user_metadata for role (useful for dev tools and faster)
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      const metadataRole = supabaseUser?.user_metadata?.role
      if (metadataRole === 'admin') {
        isAdmin = true
      }
      
      // Then check database profile (only if metadata check didn't find admin)
      if (!isAdmin) {
        try {
          const profile = await getProfileWithRole(userId)
          if (profile && profile.role === 'admin') {
            isAdmin = true
          }
        } catch (profileError) {
          // If profile check fails (e.g., permission denied), mark as error
          // We'll fail open in this case
          roleCheckError = true
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[getPublicAccessStatus] Error checking profile role for user ${userId}:`, profileError)
          }
        }
      }
    } catch (error) {
      // If metadata check fails, mark as error and fail open
      roleCheckError = true
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[getPublicAccessStatus] Error checking admin role for user ${userId}:`, error)
      }
    }
    
    // If we confirmed user is admin, grant access
    if (isAdmin) {
      return { access: true }
    }
    
    // If we couldn't verify role due to errors, fail open (allow access)
    // This prevents blocking admins who might have permission issues
    if (roleCheckError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[getPublicAccessStatus] Could not verify role for user ${userId}, allowing access (fail open)`)
      }
      return { access: true }
    }
  }
  
  // Check if user has active subscription and plan-based entitlements
  if (userId) {
    const subscriptionStatus = await checkSubscription()
    if (subscriptionStatus.isActive) {
      // For lessons, check plan-based entitlements
      if (target.type === 'lesson') {
        try {
          const { canAccessDomain } = await import('@/lib/entitlements')
          const hasAccess = await canAccessDomain(userId, target.domainId)
          if (!hasAccess) {
            // User has subscription but not the right plan - show upgrade message
            return { 
              access: false, 
              requiresUpgrade: true,
              domainId: target.domainId 
            }
          }
        } catch (error) {
          // If entitlements check fails, fail open (allow access)
          // This prevents blocking users if entitlements system has issues
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[getPublicAccessStatus] Error checking entitlements for domain ${target.domainId}:`, error)
          }
        }
      }
      
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

