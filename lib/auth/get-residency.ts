import { prisma } from '@/lib/prisma/server'

/**
 * Get user residency information
 * Returns the current residency year or null if not set
 * Throws on error so callers can distinguish between "no residency" and "error"
 */
export async function getUserResidency(userId: string): Promise<{ currentResidency: number | null }> {
  try {
    const userResidency = await prisma.userResidency.findUnique({
      where: { userId },
      select: { currentResidency: true },
    })

    return {
      currentResidency: userResidency?.currentResidency ?? null,
    }
  } catch (error: any) {
    // Handle missing table (P2021) or missing columns (P2022)
    if (error?.code === 'P2021' || error?.code === 'P2022' || error?.message?.includes('does not exist')) {
      // Table doesn't exist, return null
      return {
        currentResidency: null,
      }
    }
    throw error
  }
}

