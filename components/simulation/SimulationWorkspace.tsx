'use client'

import CaseFileViewer from '@/components/simulation/CaseFileViewer'
import DecisionWorkspace from '@/components/simulation/DecisionWorkspace'
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

interface SimulationWorkspaceProps {
  caseItem: any
  simulation: any
  userId: string
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
      briefing: parseCaseBriefing(caseItem.briefing_doc),
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
  const caseStructure = caseData?.briefing || parseCaseBriefing(caseItem.briefing_doc)
  
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
    mutationFn: () =>
      fetchJson<{ debriefId?: string }>('/api/generate-debrief', {
        method: 'POST',
        body: { simulationId: simulation.id },
      }),
    onSuccess: () => {
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
    retry: 3,
    retryDelay: 1000,
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

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* LEFT PANEL: Case Files & Data */}
      <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
        <CaseFileViewer
          briefingDoc={caseItem.briefing_doc}
          datasets={caseItem.datasets}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* RIGHT PANEL: Decision Workspace */}
      <ResizablePanel defaultSize={60}>
        <DecisionWorkspace
          decisionPoints={decisionPoints}
          personas={caseStructure?.keyStakeholders || []}
          currentIndex={state.currentDecisionPoint}
          decisions={state.decisions}
          onDecisionComplete={handleDecisionComplete}
          onComplete={handleComplete}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
