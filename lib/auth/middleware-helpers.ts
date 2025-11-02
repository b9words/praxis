import { createClient } from '@supabase/supabase-js'
import type { UserRole } from './authorize'

/**
 * Get user role from database for middleware
 * Uses Supabase client directly to avoid Prisma dependency in edge runtime
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      // Log error in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error(`[getUserRole] Error fetching role for user ${userId}:`, error.message)
      }
      return null
    }

    if (!data) {
      // Log missing profile in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[getUserRole] No profile found for user ${userId}`)
      }
      return null
    }

    return data.role as UserRole
  } catch (error) {
    // Log unexpected errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[getUserRole] Unexpected error for user ${userId}:`, error)
    }
    return null
  }
}

/**
 * Check if user has required role using role hierarchy
 */
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    member: 1,
    editor: 2,
    admin: 3,
  }

  const userRoleLevel = roleHierarchy[userRole]
  
  return requiredRoles.some((role) => userRoleLevel >= roleHierarchy[role])
}

/**
 * Check if user has active subscription
 * Uses Supabase client directly to avoid Prisma dependency in edge runtime
 */
export async function checkSubscription(userId: string): Promise<{
  hasSubscription: boolean
  isActive: boolean
  userId: string
  subscriptionId?: string
}> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status, current_period_end')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return {
        hasSubscription: false,
        isActive: false,
        userId,
      }
    }

    const now = new Date()
    const isActive = data.status === 'active' && new Date(data.current_period_end) >= now

    return {
      hasSubscription: true,
      isActive,
      userId,
      subscriptionId: data.id,
    }
  } catch (error) {
    // Log unexpected errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[checkSubscription] Unexpected error for user ${userId}:`, error)
    }
    return {
      hasSubscription: false,
      isActive: false,
      userId,
    }
  }
}

