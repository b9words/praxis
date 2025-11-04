import { getUserResidency as getUserResidencyRepo } from '@/lib/db/profiles'

/**
 * Get user residency information
 * Returns the current residency year or null if not set
 * Throws on error so callers can distinguish between "no residency" and "error"
 */
export async function getUserResidency(userId: string): Promise<{ currentResidency: number | null }> {
  try {
    const userResidency = await getUserResidencyRepo(userId)

    return {
      currentResidency: userResidency?.currentResidency ?? null,
    }
  } catch (error: any) {
    // Return null on any error (repository handles errors gracefully)
    return {
      currentResidency: null,
    }
  }
}

