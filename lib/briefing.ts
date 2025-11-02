import { prisma } from './prisma/server'
import { cache, CacheTags } from './cache'

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
    },
    ['briefing', 'current'],
    {
      tags: ['briefing'],
      revalidate: 300, // 5 minutes
    }
  )

  return await getCachedBriefing()
}

