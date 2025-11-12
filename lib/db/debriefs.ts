/**
 * Debriefs repository
 * All debrief database operations go through here
 */

import { dbCall, assertFound, isColumnNotFoundError } from './utils'
import type { Prisma } from '@prisma/client'

const defaultInclude = {
  simulation: {
    include: {
      case: {
        select: {
          id: true,
          title: true,
          rubric: true,
        },
      },
    },
  },
} as const

/**
 * Get debrief by simulation ID
 */
export async function getDebriefBySimulationId(simulationId: string) {
  return dbCall(async (prisma) => {
    return prisma.debrief.findUnique({
      where: { simulationId },
      include: defaultInclude,
    })
  }).catch((error: any) => {
    // If column doesn't exist (P2022), return null gracefully
    if (isColumnNotFoundError(error)) {
      return null
    }
    throw error
  })
}

/**
 * List debriefs by user
 */
export async function listDebriefsByUser(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.debrief.findMany({
      where: {
        simulation: {
          userId,
        },
      },
      select: {
        id: true,
        simulationId: true,
        scores: true,
        summaryText: true,
        radarChartData: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
}

/**
 * Create or update debrief
 */
export async function upsertDebrief(data: {
  simulationId: string
  scores: any
  summaryText: string
  radarChartData: any
  rubricVersion?: string | null
  goldStandardExemplar?: string | null
}) {
  return dbCall(async (prisma) => {
    return prisma.debrief.upsert({
      where: { simulationId: data.simulationId },
      update: {
        scores: data.scores,
        summaryText: data.summaryText,
        radarChartData: {
          ...(data.radarChartData || {}),
          ...(data.goldStandardExemplar && { goldStandardExemplar: data.goldStandardExemplar }),
        },
        ...(data.rubricVersion !== undefined && { rubricVersion: data.rubricVersion }),
      },
      create: {
        simulationId: data.simulationId,
        scores: data.scores,
        summaryText: data.summaryText,
        radarChartData: {
          ...(data.radarChartData || {}),
          ...(data.goldStandardExemplar && { goldStandardExemplar: data.goldStandardExemplar }),
        },
        rubricVersion: data.rubricVersion ?? null,
      },
      include: defaultInclude,
    })
  })
}

/**
 * Get user's aggregate scores across all completed simulations
 */
export interface AggregateScores {
  financialAcumen: number
  strategicThinking: number
  marketAwareness: number
  riskManagement: number
  leadershipJudgment: number
}

export async function getUserAggregateScores(userId: string): Promise<AggregateScores> {
  return dbCall(async (prisma) => {
    const debriefs = await prisma.debrief.findMany({
      where: {
        simulation: {
          userId,
          status: 'completed',
        },
      },
      select: {
        radarChartData: true,
      },
    })

    if (debriefs.length === 0) {
      return {
        financialAcumen: 0,
        strategicThinking: 0,
        marketAwareness: 0,
        riskManagement: 0,
        leadershipJudgment: 0,
      }
    }

    const scores = {
      financialAcumen: [] as number[],
      strategicThinking: [] as number[],
      marketAwareness: [] as number[],
      riskManagement: [] as number[],
      leadershipJudgment: [] as number[],
    }

    debriefs.forEach((debrief) => {
      const data = debrief.radarChartData as any
      if (data.financialAcumen) scores.financialAcumen.push(data.financialAcumen)
      if (data.strategicThinking) scores.strategicThinking.push(data.strategicThinking)
      if (data.marketAwareness) scores.marketAwareness.push(data.marketAwareness)
      if (data.riskManagement) scores.riskManagement.push(data.riskManagement)
      if (data.leadershipJudgment) scores.leadershipJudgment.push(data.leadershipJudgment)
    })

    const average = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)

    return {
      financialAcumen: average(scores.financialAcumen),
      strategicThinking: average(scores.strategicThinking),
      marketAwareness: average(scores.marketAwareness),
      riskManagement: average(scores.riskManagement),
      leadershipJudgment: average(scores.leadershipJudgment),
    }
  }).catch(() => ({
    financialAcumen: 0,
    strategicThinking: 0,
    marketAwareness: 0,
    riskManagement: 0,
    leadershipJudgment: 0,
  }))
}

/**
 * Get recommended next simulation for a user
 */
export async function getRecommendedSimulation(userId: string): Promise<string | null> {
  return dbCall(async (prisma) => {
    // Get all completed case IDs for the user
    const completedSimulations = await prisma.simulation.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: {
        caseId: true,
      },
    })

    const completedCaseIds = completedSimulations.map((s) => s.caseId)

    // Get a case that hasn't been completed
    const nextCase = await prisma.case.findFirst({
      where: {
        status: 'published',
        id: {
          notIn: completedCaseIds.length > 0 ? completedCaseIds : [],
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return nextCase?.id || null
  }).catch(() => null)
}

/**
 * Get recent debriefs with detailed includes for recommendation engine
 */
export async function getRecentDebriefsForRecommendations(
  userId: string,
  since: Date
) {
  return dbCall(async (prisma) => {
    return prisma.debrief.findMany({
      where: {
        simulation: {
          userId,
        },
        createdAt: {
          gte: since,
        },
      },
      include: {
        simulation: {
          include: {
            case: {
              include: {
                competencies: {
                  include: {
                    competency: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })
  })
}

