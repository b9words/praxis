import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { CaseStudyState } from '@/types/case-study.types'

/**
 * Hook for persisting case study state
 * Renamed from useSimulationPersistence for consistency
 */
export function useCaseStudyPersistence(simulationId: string) {
  const queryClient = useQueryClient()

  // Load state
  const { data: state, isLoading } = useQuery({
    queryKey: queryKeys.simulations.state(simulationId),
    queryFn: async () => {
      const response = await fetchJson<{
        stageStates: Record<string, any>
        currentStageId: string | null
        eventLog: any[]
      }>(`/api/case-studies/${simulationId}/state`)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Save state
  const saveMutation = useMutation({
    mutationFn: async (newState: CaseStudyState) => {
      return fetchJson(`/api/case-studies/${simulationId}/state`, {
        method: 'PUT',
        body: {
          stageStates: { simulationState: newState },
          currentStageId: newState.currentDecisionPoint.toString(),
          eventLog: newState.decisions.map((d, idx) => ({
            event: 'DECISION_COMPLETED',
            decisionPointId: d.decisionPointId,
            timestamp: newState.lastUpdated,
            index: idx,
          })),
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.simulations.state(simulationId) })
    },
  })

  return {
    state,
    isLoading,
    saveState: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  }
}

// Export alias for backward compatibility
export { useCaseStudyPersistence as useSimulationPersistence }

