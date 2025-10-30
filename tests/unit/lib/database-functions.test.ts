import { getUserAggregateScores } from '@/lib/database-functions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma/server', () => ({
  prisma: {
    debrief: {
      findMany: vi.fn(),
    },
  },
}))

describe('Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserAggregateScores', () => {
    it('should return zero scores when user has no debriefs', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      vi.mocked(prisma.debrief.findMany).mockResolvedValue([])

      const scores = await getUserAggregateScores('user-123')

      expect(scores).toEqual({
        financialAcumen: 0,
        strategicThinking: 0,
        marketAwareness: 0,
        riskManagement: 0,
        leadershipJudgment: 0,
      })
    })

    it('should calculate average scores from multiple debriefs', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      vi.mocked(prisma.debrief.findMany).mockResolvedValue([
        {
          radarChartData: {
            financialAcumen: 4,
            strategicThinking: 3,
            marketAwareness: 2,
            riskManagement: 3,
            leadershipJudgment: 3,
          },
        },
        {
          radarChartData: {
            financialAcumen: 5,
            strategicThinking: 4,
            marketAwareness: 3,
            riskManagement: 4,
            leadershipJudgment: 4,
          },
        },
        {
          radarChartData: {
            financialAcumen: 3,
            strategicThinking: 2,
            marketAwareness: 1,
            riskManagement: 2,
            leadershipJudgment: 2,
          },
        },
      ] as any)

      const scores = await getUserAggregateScores('user-123')

      // Averages: (4+5+3)/3 = 4, (3+4+2)/3 = 3, etc.
      expect(scores.financialAcumen).toBeCloseTo(4, 2)
      expect(scores.strategicThinking).toBeCloseTo(3, 2)
      expect(scores.marketAwareness).toBeCloseTo(2, 2)
      expect(scores.riskManagement).toBeCloseTo(3, 2)
      expect(scores.leadershipJudgment).toBeCloseTo(3, 2)
    })

    it('should handle missing competency scores gracefully', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      vi.mocked(prisma.debrief.findMany).mockResolvedValue([
        {
          radarChartData: {
            financialAcumen: 4,
            // Missing other competencies
          },
        },
      ] as any)

      const scores = await getUserAggregateScores('user-123')

      expect(scores.financialAcumen).toBe(4)
      expect(scores.strategicThinking).toBe(0)
      expect(scores.marketAwareness).toBe(0)
      expect(scores.riskManagement).toBe(0)
      expect(scores.leadershipJudgment).toBe(0)
    })

    it('should filter out completed simulations only', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      
      await getUserAggregateScores('user-123')

      expect(prisma.debrief.findMany).toHaveBeenCalledWith({
        where: {
          simulation: {
            userId: 'user-123',
            status: 'completed',
          },
        },
        select: {
          radarChartData: true,
        },
      })
    })
  })
})

