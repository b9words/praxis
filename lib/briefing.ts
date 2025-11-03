import { prisma } from './prisma/server'
import { cache, CacheTags } from './cache'
import { isMissingTable } from './api/route-helpers'

export interface CurrentBriefing {
  domainId: string
  moduleId: string
  caseId: string
  weekOf: string
}

/**
 * Get the current week's briefing schedule
 * Returns the most recent schedule entry where weekOf <= today
 * Cached for 5 minutes
 */
export async function getCurrentBriefing(): Promise<CurrentBriefing | null> {
  const getCachedBriefing = cache(
    async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const row = await prisma.briefingSchedule.findFirst({
          where: {
            weekOf: {
              lte: today,
            },
          },
          orderBy: {
            weekOf: 'desc',
          },
        })

        if (!row) {
          return null
        }

        return {
          domainId: row.domainId,
          moduleId: row.moduleId,
          caseId: row.caseId,
          weekOf: row.weekOf.toISOString().slice(0, 10),
        }
      } catch (error: any) {
        // Handle missing table gracefully (P2021) - expected if migrations haven't run
        if (isMissingTable(error)) {
          // Silently return null if table doesn't exist
          return null
        }
        
        // Log other errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching briefing schedule:', error)
        }
        // Return null on error to allow build to continue
        return null
      }
    },
    ['briefing', 'current'],
    {
      tags: ['briefing'],
      revalidate: 300, // 5 minutes
    }
  )

  return await getCachedBriefing()
}

