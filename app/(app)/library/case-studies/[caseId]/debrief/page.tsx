import { getCurrentUser } from '@/lib/auth/get-user'
import { getCaseById, getCaseByIdWithCompetencies } from '@/lib/db/cases'
import { getSimulationByUserAndCase } from '@/lib/db/simulations'
import { getDebriefBySimulationId } from '@/lib/db/debriefs'
import { getUserAggregateScores } from '@/lib/db/debriefs'
import { getDomainIdForCompetency } from '@/lib/competency-mapping'
import { getAllInteractiveSimulations } from '@/lib/case-study-loader'
import { listCaseFiles, getCaseFile } from '@/lib/db/cases'
import { upsertCaseFromJson } from '@/lib/cases/upsert-from-json'
import { notFound, redirect } from 'next/navigation'
import DebriefClient from './DebriefClient'

export const dynamic = 'force-dynamic'

export default async function CaseStudyDebriefPage({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const { caseId } = await params

  // Fetch case details - try database first
  let caseItem = await getCaseByIdWithCompetencies(caseId).catch(() => null)
  
  // Check if this is a JSON case (not found in DB and exists as JSON)
  const { loadInteractiveSimulation } = await import('@/lib/case-study-loader')
  const jsonCase = loadInteractiveSimulation(caseId)
  const isJsonCase = !caseItem && !!jsonCase
  
  // If JSON case, upsert it to DB first
  if (isJsonCase && jsonCase) {
    try {
      const dbCaseId = await upsertCaseFromJson(caseId, user.id)
      // Now fetch the case from DB
      caseItem = await getCaseByIdWithCompetencies(dbCaseId).catch(() => null)
      if (!caseItem) {
        // Fallback: try by caseId slug
        caseItem = await getCaseByIdWithCompetencies(caseId).catch(() => null)
      }
    } catch (error) {
      console.error('Error upserting JSON case to DB:', error)
      notFound()
    }
  }
  
  if (!caseItem || !caseItem.published) {
    notFound()
  }

  // Get user's simulation for this case
  // Try database UUID first
  console.log(`[Debrief Page] Looking for simulation: userId=${user.id}, caseId=${caseItem.id}, caseSlug=${caseId}`)
  let simulation = await getSimulationByUserAndCase(user.id, caseItem.id).catch(() => null)
  
  // If not found by UUID, search all user's simulations and match by case metadata
  if (!simulation) {
    console.log(`[Debrief Page] Simulation not found by UUID, searching all user simulations...`)
    // Query simulations with full case data including metadata
    const { prisma } = await import('@/lib/prisma/server')
    const allUserSimulations = await prisma.simulation.findMany({
      where: { userId: user.id },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            metadata: true,
          },
        },
        debrief: {
          select: {
            id: true,
            scores: true,
            summaryText: true,
            radarChartData: true,
          },
        },
      },
    }).catch(() => [])
    
    console.log(`[Debrief Page] Found ${allUserSimulations.length} total simulations for user`)
    
    // Find simulation where the case's metadata.caseId matches our slug
    simulation = allUserSimulations.find(
      sim => {
        const simCase = sim.case as any
        const simCaseId = simCase?.metadata?.caseId
        const matches = simCaseId === caseId || sim.caseId === caseItem.id
        if (matches) {
          console.log(`[Debrief Page] Found matching simulation: ${sim.id}, caseId=${sim.caseId}, metadata.caseId=${simCaseId}`)
        }
        return matches
      }
    ) || null
  } else {
    console.log(`[Debrief Page] Found simulation by UUID: ${simulation.id}, status=${simulation.status}`)
  }
  
  if (!simulation) {
    // No simulation found - redirect to case study page
    console.error(`[Debrief Page] No simulation found for user ${user.id} and case ${caseId}`)
    redirect(`/library/case-studies/${caseId}`)
  }
  
  if (simulation.status !== 'completed') {
    // Simulation exists but not completed - redirect to tasks page
    console.log(`[Debrief Page] Simulation ${simulation.id} status is '${simulation.status}', not 'completed'`)
    redirect(`/library/case-studies/${caseId}/tasks`)
  }
  
  console.log(`[Debrief Page] Simulation ${simulation.id} is completed, proceeding to debrief`)

  // Get debrief
  let debrief = await getDebriefBySimulationId(simulation.id)
  
  // If no debrief exists but simulation is completed, try to generate it
  if (!debrief && simulation.status === 'completed') {
    try {
      console.log(`[Debrief Page] Generating debrief for simulation ${simulation.id}`)
      
      // Import debrief generation functions
      const { generateDebrief } = await import('@/lib/debrief/generator')
      const { upsertDebrief } = await import('@/lib/db/debriefs')
      const { getCaseByIdWithCompetencies } = await import('@/lib/db/cases')
      
      // Get full case data for debrief generation
      const fullCase = await getCaseByIdWithCompetencies(caseItem.id)
      
      if (!fullCase) {
        console.error(`[Debrief Page] Full case not found for ${caseItem.id}`)
        redirect(`/library/case-studies/${caseId}`)
      }
      
      console.log(`[Debrief Page] Generating debrief with case: ${fullCase.title}`)
      
      // Generate debrief synchronously
      const result = await generateDebrief({
        id: simulation.id,
        userId: simulation.userId,
        caseId: simulation.caseId,
        userInputs: simulation.userInputs,
        case: {
          id: fullCase.id,
          title: fullCase.title,
          rubric: fullCase.rubric as any,
          competencies: (fullCase as any).competencies || [],
        },
      })
      
      console.log(`[Debrief Page] Debrief generated successfully`)
      
      // Persist debrief
      debrief = await upsertDebrief({
        simulationId: simulation.id,
        scores: result.scores,
        summaryText: result.summaryText,
        radarChartData: result.radarChartData,
        rubricVersion: '1.0',
        goldStandardExemplar: result.goldStandardExemplar || null,
      })
      
      console.log(`[Debrief Page] Debrief persisted with ID: ${debrief.id}`)
    } catch (error) {
      console.error('[Debrief Page] Error generating debrief:', error)
      console.error('[Debrief Page] Error stack:', error instanceof Error ? error.stack : 'No stack')
      // Don't redirect - show error page instead
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white border border-gray-200 p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Debrief Generation Failed</h1>
            <p className="text-sm text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Unknown error occurred while generating your debrief.'}
            </p>
            <div className="flex gap-3">
              <a
                href={`/library/case-studies/${caseId}`}
                className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800"
              >
                Back to Case Study
              </a>
              <a
                href={`/library/case-studies/${caseId}/tasks`}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
              >
                View Tasks
              </a>
            </div>
          </div>
        </div>
      )
    }
  }
  
  // If still no debrief, show error instead of redirecting
  if (!debrief) {
    console.error(`[Debrief Page] No debrief found for simulation ${simulation.id}`)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white border border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Debrief Not Available</h1>
          <p className="text-sm text-gray-600 mb-4">
            No debrief was found for this completed case study. Please try completing the case study again.
          </p>
          <div className="flex gap-3">
            <a
              href={`/library/case-studies/${caseId}`}
              className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800"
            >
              Back to Case Study
            </a>
            <a
              href={`/library/case-studies/${caseId}/tasks`}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >
              View Tasks
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Get previous aggregate scores for radar comparison
  const previousScores = await getUserAggregateScores(user.id)

  // Get all simulations for recommendations
  const allSimulations = getAllInteractiveSimulations()

  // Check for gold standard file, fallback to AI-generated exemplar from debrief
  const caseFiles = await listCaseFiles(caseItem.id)
  const goldStandardFile = caseFiles.find(
    (f) => f.fileName === 'gold-standard.md' || f.fileId === 'gold-standard'
  )
  let goldStandardContent: string | null = null
  if (goldStandardFile) {
    const file = await getCaseFile(caseItem.id, goldStandardFile.fileId)
    goldStandardContent = file?.content || null
  } else {
    // Fallback to AI-generated exemplar stored in debrief
    const radarData = debrief.radarChartData as any
    goldStandardContent = radarData?.goldStandardExemplar || null
  }

  // Extract user's decision summary from simulation
  const userInputs = simulation.userInputs as any
  const stageStates = userInputs?.stageStates || {}
  const simulationState = stageStates?.simulationState || {}
  const decisions = simulationState?.decisions || userInputs?.decisions || []
  
  // Find first multiple-choice decision for "Your Decision" summary
  const primaryDecision = decisions.find((d: any) => d.selectedOption)
  const decisionSummary = primaryDecision
    ? `You selected: ${primaryDecision.selectedOption}`
    : 'You completed the case study analysis.'

  // Extract key insight from summaryText (first sentence)
  const summaryText = debrief.summaryText || ''
  const keyInsight = summaryText.split('.')[0] + '.' || 'You completed the case study.'

  // Find weakest and strongest competencies for Learning Loop
  const radarData = debrief.radarChartData as any
  const competencies = [
    { key: 'financialAcumen', name: 'Financial Acumen', score: radarData.financialAcumen || 0 },
    { key: 'strategicThinking', name: 'Strategic Thinking', score: radarData.strategicThinking || 0 },
    { key: 'marketAwareness', name: 'Market Awareness', score: radarData.marketAwareness || 0 },
    { key: 'riskManagement', name: 'Risk Management', score: radarData.riskManagement || 0 },
    { key: 'leadershipJudgment', name: 'Leadership Judgment', score: radarData.leadershipJudgment || 0 },
  ].filter(c => c.score > 0)

  const weakestCompetency = competencies.length > 0
    ? competencies.reduce((min, c) => (c.score < min.score ? c : min), competencies[0])
    : null

  const strongestCompetency = competencies.length > 0
    ? competencies.reduce((max, c) => (c.score > max.score ? c : max), competencies[0])
    : null

  // Find recommendations for weakest/strongest competencies
  const getRecommendationForCompetency = (competencyKey: string) => {
    const domainId = getDomainIdForCompetency(competencyKey)
    if (!domainId) return null

    // Find a simulation in that domain
    const domainSimulation = allSimulations.find((sim) => {
      const simDomainId = (sim as any).domainId || (sim as any).domain
      return simDomainId === domainId && sim.caseId !== caseId
    })

    if (domainSimulation) {
      return {
        caseId: domainSimulation.caseId,
        title: domainSimulation.title,
        description: domainSimulation.description || 'An advanced challenge to strengthen your skills.',
        url: `/library/case-studies/${domainSimulation.caseId}`,
      }
    }

    return null
  }

  const weaknessRecommendation = weakestCompetency
    ? getRecommendationForCompetency(weakestCompetency.key)
    : null

  const strengthRecommendation = strongestCompetency
    ? getRecommendationForCompetency(strongestCompetency.key)
    : null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <DebriefClient
        caseId={caseId}
        caseTitle={caseItem.title}
        debrief={debrief}
        previousScores={previousScores}
        currentScores={radarData}
        decisionSummary={decisionSummary}
        keyInsight={keyInsight}
        goldStandardContent={goldStandardContent}
        weaknessRecommendation={weaknessRecommendation}
        strengthRecommendation={strengthRecommendation}
        weakestCompetency={weakestCompetency?.name || null}
        strongestCompetency={strongestCompetency?.name || null}
        userId={user.id}
      />
    </div>
  )
}

