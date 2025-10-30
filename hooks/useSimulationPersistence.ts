import { useCaseStudyStore } from '@/lib/case-study-store'
import { useEffect, useRef } from 'react'

/**
 * Hook to automatically save simulation state to the API
 * Call this hook in the CaseStudyPlayer component with a simulationId
 */
export function useSimulationPersistence(simulationId: string | null) {
  const { stageStates, currentStageId, eventLog } = useCaseStudyStore()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')

  useEffect(() => {
    if (!simulationId) return

    // Debounce saves - only save after 2 seconds of inactivity
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const currentState = JSON.stringify({
        stageStates,
        currentStageId,
        eventLog,
      })

      // Only save if state has changed
      if (currentState === lastSavedRef.current) {
        return
      }

      try {
        const response = await fetch(`/api/simulations/${simulationId}/state`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: currentState,
        })

        if (response.ok) {
          lastSavedRef.current = currentState
        } else {
          console.error('Failed to save simulation state')
        }
      } catch (error) {
        console.error('Error saving simulation state:', error)
      }
    }, 2000) // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [simulationId, stageStates, currentStageId, eventLog])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])
}

