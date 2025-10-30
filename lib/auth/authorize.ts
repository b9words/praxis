import { prisma } from '@/lib/prisma/server';
import { getCurrentUser } from './get-user';

export type UserRole = 'member' | 'editor' | 'admin'

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
 */
export async function requireAuth(): Promise<{ id: string; role: UserRole }> {
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

  return { id: profile.id, role: profile.role as UserRole }
}

