'use client'

import UniversalAssetViewer from '@/components/simulation/UniversalAssetViewer'
import DecisionWorkspace from '@/components/simulation/DecisionWorkspace'
import NeedARefresher from '@/components/simulation/NeedARefresher'
import ErrorState from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { trackEvents } from '@/lib/analytics'
import { fetchJson } from '@/lib/api'
import { parseCaseBriefing } from '@/lib/parse-case-template'
import { queryKeys } from '@/lib/queryKeys'
import { DecisionPoint, SimulationState, UserDecision } from '@/types/simulation.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface SimulationWorkspaceProps {
  caseItem: any
  simulation: any
  userId: string
  softPaywallEnabled?: boolean
}

interface CaseData {
  title: string
  description: string
  briefing: any
  datasets?: any
  challenges: Array<{
    id: string
    order: number
    title: string
    description: string
    type: string
    rubricMapping: string[]
    config?: any
  }>
  rubric: any
}

export default function SimulationWorkspace({
  caseItem,
  simulation,
  userId,
  softPaywallEnabled = false,
}: SimulationWorkspaceProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [state, setState] = useState<SimulationState>({
    currentDecisionPoint: 0,
    decisions: [],
    startedAt: simulation.started_at || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  })

  // Fetch case JSON from Storage if storage_path exists
  const { data: storageData, isLoading: isLoadingStorage } = useQuery({
    queryKey: queryKeys.storage.byPath(caseItem.storage_path!),
    queryFn: ({ signal }) =>
      fetchJson<{ success: boolean; content?: string; error?: string }>(
        `/api/storage?path=${encodeURIComponent(caseItem.storage_path!)}`,
        { signal }
      ),
    enabled: !!caseItem.storage_path,
    retry: false,
  })

  // Process case data from storage or database
  const caseData: CaseData | null = (() => {
    if (caseItem.storage_path && storageData?.success && storageData.content) {
      try {
        return JSON.parse(storageData.content)
      } catch (error) {
        console.error('Failed to parse case data from storage:', error)
        // Fall through to fallback
      }
    }
    
    // Fallback to database data
    return {
      title: caseItem.title,
      description: caseItem.description || '',
      briefing: parseCaseBriefing(caseItem.briefingDoc || caseItem.briefing_doc),
      datasets: caseItem.datasets,
      challenges: [{
        id: 'decision-1',
        order: 1,
        title: 'Analyze the Situation',
        description: 'Based on the case information and data provided, what is your recommended approach?',
        type: 'text',
        rubricMapping: Object.keys(caseItem.rubric?.criteria || {}),
      }],
      rubric: caseItem.rubric || {},
    }
  })()

  const isLoading = isLoadingStorage && !!caseItem.storage_path

  // Track simulation started when component mounts
  useEffect(() => {
    if (caseItem && simulation && !isLoading) {
      trackEvents.simulationStarted(simulation.id, caseItem.id, userId)
    }
  }, [caseItem, simulation, userId, isLoading])

  // Parse case structure for briefing doc (backward compatibility)
  const briefingDoc = caseItem.briefingDoc || caseItem.briefing_doc || null
  const caseStructure = caseData?.briefing || parseCaseBriefing(briefingDoc)
  
  // Get decision points from case data
  const decisionPoints: DecisionPoint[] = (caseData?.challenges as DecisionPoint[]) || [
    {
      id: 'decision-1',
      order: 1,
      title: 'Analyze the Situation',
      description: 'Based on the case information and data provided, what is your recommended approach?',
      type: 'text' as const,
      rubricMapping: Object.keys(caseItem.rubric?.criteria || {}),
    },
  ]

  // Load existing state from simulation
  useEffect(() => {
    if (simulation.user_inputs && typeof simulation.user_inputs === 'object') {
      const inputs = simulation.user_inputs as any
      if (inputs.decisions && Array.isArray(inputs.decisions)) {
        setState(prev => ({
          ...prev,
          decisions: inputs.decisions,
          currentDecisionPoint: inputs.currentDecisionPoint || 0,
        }))
      }
    }
  }, [simulation.user_inputs])

  // Mutation for saving simulation state
  const saveStateMutation = useMutation({
    mutationFn: (newState: SimulationState) =>
      fetchJson(`/api/simulations/${simulation.id}/state`, {
        method: 'PUT',
        body: {
          stageStates: { simulationState: newState }, // Store full state in stageStates
          currentStageId: newState.currentDecisionPoint.toString(),
          eventLog: newState.decisions.map((d, idx) => ({
            event: 'DECISION_COMPLETED',
            decisionPointId: d.decisionPointId,
            timestamp: newState.lastUpdated,
            index: idx,
          })),
        },
      }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save your progress')
    },
  })

  const handleDecisionComplete = async (decision: UserDecision) => {
    const newDecisions = [...state.decisions, decision]
    const newState: SimulationState = {
      ...state,
      decisions: newDecisions,
      currentDecisionPoint: state.currentDecisionPoint + 1,
      lastUpdated: new Date().toISOString(),
    }

    setState(newState)
    saveStateMutation.mutate(newState)
  }

  // Mutation for generating debrief
  const generateDebriefMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchJson<{ 
        debriefId?: string
        jobId?: string
        status?: string
        fromCache?: boolean
        debrief?: any
      }>('/api/generate-debrief', {
        method: 'POST',
        body: { simulationId: simulation.id },
      })

      // If debrief already exists (from cache), return immediately
      if (response.debriefId || response.fromCache) {
        return { debriefId: response.debriefId || response.debrief?.id }
      }

      // If job was created, poll for completion
      if (response.jobId) {
        const jobId = response.jobId
        const maxAttempts = 60 // Poll for up to 60 seconds (1 minute)
        const pollInterval = 1000 // Poll every 1 second

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
          
          const jobStatus = await fetchJson<{
            id: string
            type: string
            status: string
            result?: { debriefId?: string; debrief?: any }
            error?: string
          }>(`/api/jobs/${jobId}`)

          if (jobStatus.status === 'completed') {
            if (jobStatus.error) {
              throw new Error(jobStatus.error)
            }
            // Extract debriefId from result
            const debriefId = jobStatus.result?.debriefId || jobStatus.result?.debrief?.id
            if (debriefId) {
              return { debriefId }
            }
            // Fallback: use simulationId to fetch debrief
            return { debriefId: simulation.id }
          } else if (jobStatus.status === 'failed') {
            throw new Error(jobStatus.error || 'Debrief generation failed')
          }
          // Continue polling if status is 'pending' or 'processing'
        }

        // If we've exhausted all attempts, throw an error
        throw new Error('Debrief generation timed out. Please check back later.')
      }

      // Fallback: if no jobId or debriefId, something went wrong
      throw new Error('Unexpected response from debrief generation')
    },
    onSuccess: (data) => {
      // Track simulation completion
      trackEvents.simulationCompleted(simulation.id, caseItem.id, userId)
      
      // Invalidate debrief queries
      queryClient.invalidateQueries({ queryKey: queryKeys.debriefs.bySimulation(simulation.id) })
      
      toast.success('Debrief generated!')
      router.push(`/debrief/${simulation.id}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to generate debrief')
    },
    retry: 0, // Don't retry - we handle polling ourselves
  })

  // Mutation for completing simulation
  const completeMutation = useMutation({
    mutationFn: () => fetchJson<{ success: boolean }>(`/api/simulations/${simulation.id}/complete`, {
      method: 'POST',
    }),
    onSuccess: () => {
      // Invalidate simulation queries
      queryClient.invalidateQueries({ queryKey: queryKeys.simulations.byId(simulation.id) })
      
      // Generate debrief after completion
      toast.loading('Generating your performance debrief...')
      generateDebriefMutation.mutate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete simulation')
    },
  })

  const handleComplete = async () => {
    try {
      // Save final state first
      await saveStateMutation.mutateAsync(state)
      
      toast.loading('Completing simulation...')
      await completeMutation.mutateAsync()
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Failed to complete simulation:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <LoadingState type="simulation" />
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <ErrorState
          title="Failed to Load Case"
          message="Unable to load the case study data. Please try again."
          onRetry={() => window.location.reload()}
          showBackToDashboard={true}
        />
      </div>
    )
  }

  // Extract competencies from case item
  const competencies = caseItem.competencies?.map((cc: any) => ({
    id: cc.competency?.id || cc.competencyId,
    name: cc.competency?.name || 'Unknown',
  })) || []

  // Get recommended lessons from caseItem (passed from server)
  const recommendedLessons = (caseItem as any).recommendedLessons || []
  const showNeedARefresher = competencies.length > 0 && recommendedLessons.length > 0

  // Calculate progress
  const totalDecisionPoints = decisionPoints.length
  const currentProgress = state.currentDecisionPoint
  const progressPercentage = totalDecisionPoints > 0 ? (currentProgress / totalDecisionPoints) * 100 : 0

  return (
    <div className="h-full flex flex-col">
      {/* HEADER: Title, Breadcrumb, and Progress */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 uppercase tracking-wide">
          <Link href="/dashboard" className="hover:text-gray-700 font-medium flex items-center gap-1">
            <Home className="h-3 w-3" />
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/simulations" className="hover:text-gray-700 font-medium">
            Simulations
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-700 font-medium">{caseData?.title || caseItem.title}</span>
        </div>

        {/* Title and Progress */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{caseData?.title || caseItem.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Decision {currentProgress + 1} of {totalDecisionPoints}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-48">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* LEFT PANEL: Case Files & Data (60% default for 3:2 ratio) */}
          <ResizablePanel defaultSize={60} minSize={30} maxSize={70}>
        <div className="h-full flex flex-col overflow-auto">
          {/* Need a Refresher? component */}
          {showNeedARefresher && (
            <div className="p-4 border-b border-neutral-200">
              <NeedARefresher 
                competencies={competencies}
                caseId={caseItem.id}
                recommendedLessons={recommendedLessons}
              />
            </div>
          )}
          {/* Case Files */}
          <div className="flex-1 overflow-auto">
      <UniversalAssetViewer
        briefingDoc={caseItem.briefingDoc || caseItem.briefing_doc || null}
        datasets={caseItem.datasets}
        caseFiles={caseItem.files}
      />
          </div>
        </div>
      </ResizablePanel>

          <ResizableHandle withHandle />

          {/* RIGHT PANEL: Decision Workspace (40% default for 3:2 ratio) */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
            <DecisionWorkspace
              decisionPoints={decisionPoints}
              personas={caseStructure?.keyStakeholders || []}
              currentIndex={state.currentDecisionPoint}
              decisions={state.decisions}
              onDecisionComplete={handleDecisionComplete}
              onComplete={handleComplete}
              softPaywallEnabled={softPaywallEnabled}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
