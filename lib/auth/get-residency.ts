import { prisma } from '@/lib/prisma/server'

/**
 * Get user residency information
 * Returns the current residency year or null if not set
 * Throws on error so callers can distinguish between "no residency" and "error"
 */
export async function getUserResidency(userId: string): Promise<{ currentResidency: number | null }> {
  const userResidency = await prisma.userResidency.findUnique({
    where: { userId },
    select: { currentResidency: true },
  })

  return {
    currentResidency: userResidency?.currentResidency ?? null,
  }
}

