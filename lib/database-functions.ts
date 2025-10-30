import { prisma } from './prisma/server'

/**
 * Get user's aggregate scores across all completed simulations
 * Replaces: get_user_aggregate_scores(user_uuid)
 */
export async function getUserAggregateScores(userId: string) {
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
}

/**
 * Get recommended next simulation for a user
 * Replaces: get_recommended_simulation(user_uuid)
 */
export async function getRecommendedSimulation(userId: string): Promise<string | null> {
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
}

