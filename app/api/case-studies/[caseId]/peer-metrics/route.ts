import { getCurrentUser } from '@/lib/auth/get-user'
import { getCaseById } from '@/lib/db/cases'
import { getSimulationByUserAndCase } from '@/lib/db/simulations'
import { dbCall } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/case-studies/[caseId]/peer-metrics
 * Get peer comparison metrics for a case study
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId } = await params

    // Verify case exists
    const caseItem = await getCaseById(caseId)
    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Get user's simulation for this case
    const userSimulation = await getSimulationByUserAndCase(user.id, caseItem.id)

    // Get all completed simulations for this case
    const allSimulations = await dbCall(async (prisma) => {
      return prisma.simulation.findMany({
        where: {
          caseId: caseItem.id,
          status: 'completed',
        },
        select: {
          id: true,
          userId: true,
          userInputs: true,
          debrief: {
            select: {
              radarChartData: true,
            },
          },
        },
      })
    })

    // Extract decision distribution from first multiple-choice decision
    const decisionsPie: Array<{ label: string; count: number }> = []
    const decisionCounts = new Map<string, number>()

    allSimulations.forEach((sim) => {
      const userInputs = sim.userInputs as any
      const stageStates = userInputs?.stageStates || {}
      const simulationState = stageStates?.simulationState || {}
      const decisions = simulationState?.decisions || userInputs?.decisions || []

      // Find first multiple-choice decision
      const firstMultipleChoice = decisions.find((d: any) => d.selectedOption)
      if (firstMultipleChoice?.selectedOption) {
        const option = firstMultipleChoice.selectedOption
        decisionCounts.set(option, (decisionCounts.get(option) || 0) + 1)
      }
    })

    // Convert to array format
    decisionCounts.forEach((count, label) => {
      decisionsPie.push({ label, count })
    })

    // Calculate competency percentiles
    const percentiles: Array<{ competency: string; percentile: number }> = []
    
    if (userSimulation?.debrief) {
      const userRadarData = (userSimulation.debrief.radarChartData as any) || {}
      
      // Collect all peer scores for each competency
      const competencyScores: Record<string, number[]> = {
        financialAcumen: [],
        strategicThinking: [],
        marketAwareness: [],
        riskManagement: [],
        leadershipJudgment: [],
      }

      allSimulations.forEach((sim) => {
        if (sim.debrief?.radarChartData) {
          const radarData = sim.debrief.radarChartData as any
          Object.keys(competencyScores).forEach((key) => {
            if (radarData[key] !== undefined && radarData[key] !== null) {
              competencyScores[key].push(radarData[key])
            }
          })
        }
      })

      // Calculate percentiles for user's scores
      Object.keys(competencyScores).forEach((key) => {
        const userScore = userRadarData[key]
        if (userScore !== undefined && userScore !== null) {
          const scores = competencyScores[key].sort((a, b) => a - b)
          if (scores.length > 0) {
            const belowCount = scores.filter((s) => s < userScore).length
            const percentile = Math.round((belowCount / scores.length) * 100)
            
            // Map key to display name
            const displayName = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())
              .trim()

            percentiles.push({
              competency: displayName,
              percentile: Math.min(100, Math.max(0, percentile)),
            })
          }
        }
      })
    }

    return NextResponse.json({
      decisionsPie,
      percentiles,
      totalPeers: allSimulations.length,
    })
  } catch (error) {
    console.error('Error fetching peer metrics:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch peer metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

