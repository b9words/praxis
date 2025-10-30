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

    if (error || !data) {
      return null
    }

    return data.role as UserRole
  } catch {
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

