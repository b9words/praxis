import { ensureProfileExists } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getCachedUserData, CacheTags } from '@/lib/cache'
import { getUserResidency } from '@/lib/db/profiles'
import { countArticlesForResidency } from '@/lib/db/articles'
import { countCompletedArticlesForResidency } from '@/lib/db/articleProgress'
import { countCompletedSimulations } from '@/lib/db/simulations'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/user/progress
 * Get user progress summary for navbar
 * Soft-fails: returns zeros if profile missing or table missing
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({
        currentResidency: null,
        articlesCompleted: 0,
        totalArticles: 0,
        simulationsCompleted: 0,
        progressPercentage: 0,
      }, { status: 200 })
    }

    // Ensure profile exists (non-blocking) - must be outside cached function
    // since it uses cookies() which cannot be inside unstable_cache
    await ensureProfileExists(user.id, user.email || undefined)

    // Cache progress per user (2 minutes revalidate, userId in key)
    const getCachedProgress = getCachedUserData(
      user.id,
      async () => {
        // Get user residency
        const residency = await getUserResidency(user.id).catch(() => null)

        if (!residency?.currentResidency) {
          return {
            currentResidency: null,
            articlesCompleted: 0,
            totalArticles: 0,
            simulationsCompleted: 0,
            progressPercentage: 0,
          }
        }

        const residencyYear = residency.currentResidency

        // Get articles for current residency
        const totalArticles = await countArticlesForResidency(residencyYear)

        // Get completed articles
        const articlesCompleted = await countCompletedArticlesForResidency(user.id, residencyYear)

        // Get completed simulations
        const simulationsCompleted = await countCompletedSimulations(user.id)

        const progressPercentage = totalArticles > 0 ? Math.round((articlesCompleted / totalArticles) * 100) : 0

        return {
          currentResidency: residencyYear,
          articlesCompleted,
          totalArticles,
          simulationsCompleted,
          progressPercentage,
        }
      },
      ['progress', 'summary'],
      {
        tags: [CacheTags.USER_PROGRESS],
        revalidate: 120, // 2 minutes
      }
    )

    const progress = await getCachedProgress()

    return NextResponse.json(progress)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      // Return empty progress instead of 401 to prevent auth loops
      return NextResponse.json({
        currentResidency: null,
        articlesCompleted: 0,
        totalArticles: 0,
        simulationsCompleted: 0,
        progressPercentage: 0,
      }, { status: 200 })
    }
    // Silently return empty progress if profile doesn't exist yet
    if (error instanceof Error && error.message.includes('Profile not found')) {
      return NextResponse.json({
        currentResidency: null,
        articlesCompleted: 0,
        totalArticles: 0,
        simulationsCompleted: 0,
        progressPercentage: 0,
      }, { status: 200 })
    }
    console.error('Error fetching user progress:', error)
    // Return empty progress to prevent refresh loops
    return NextResponse.json({
      currentResidency: null,
      articlesCompleted: 0,
      totalArticles: 0,
      simulationsCompleted: 0,
      progressPercentage: 0,
    }, { status: 200 })
  }
}
