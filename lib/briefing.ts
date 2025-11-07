import { createClient } from '@supabase/supabase-js'
import { cache, CacheTags } from './cache'

export interface CurrentBriefing {
  domainId: string
  moduleId: string
  caseId: string
  weekOf: string
}

/**
 * Get the current week's briefing schedule (uncached version for middleware)
 * Returns the most recent schedule entry where weekOf <= today
 * Uses Supabase directly to avoid Prisma dependency in edge runtime
 * This version does NOT use caching and is safe for middleware/edge runtime
 */
async function getCurrentBriefingUncached(): Promise<CurrentBriefing | null> {
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('briefing_schedule')
      .select('domain_id, module_id, case_id, week_of')
      .lte('week_of', today.toISOString())
      .order('week_of', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      domainId: data.domain_id,
      moduleId: data.module_id,
      caseId: data.case_id,
      weekOf: new Date(data.week_of).toISOString().slice(0, 10),
    }
  } catch (error: any) {
    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching briefing schedule:', error)
    }
    // Return null on error to allow build to continue
    return null
  }
}

/**
 * Get the current week's briefing schedule
 * Returns the most recent schedule entry where weekOf <= today
 * Uses Supabase directly to avoid Prisma dependency in edge runtime
 * Cached for 5 minutes (only in server components, not middleware)
 */
/**
 * Get the current week's briefing schedule (for middleware/edge runtime)
 * This version does NOT use caching and is safe for middleware
 */
export async function getCurrentBriefingForMiddleware(): Promise<CurrentBriefing | null> {
  return getCurrentBriefingUncached()
}

/**
 * Get the current week's briefing schedule
 * Returns the most recent schedule entry where weekOf <= today
 * Uses Supabase directly to avoid Prisma dependency in edge runtime
 * Cached for 5 minutes (only in server components, not middleware)
 */
export async function getCurrentBriefing(): Promise<CurrentBriefing | null> {
  // Check if we're in middleware/edge runtime (no incremental cache available)
  // In middleware, use uncached version
  try {
    // Try to use cache - if it fails, we're in middleware
    const getCachedBriefing = cache(
      getCurrentBriefingUncached,
      ['briefing', 'current'],
      {
        tags: ['briefing'],
        revalidate: 300, // 5 minutes
      }
    )
    return await getCachedBriefing()
  } catch (error: any) {
    // If cache fails (e.g., in middleware), use uncached version
    if (error.message?.includes('incrementalCache') || error.message?.includes('cache')) {
      return getCurrentBriefingUncached()
    }
    // Re-throw other errors
    throw error
  }
}

