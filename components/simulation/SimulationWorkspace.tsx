'use client'

import CaseFileViewer from '@/components/simulation/CaseFileViewer'
import DecisionWorkspace from '@/components/simulation/DecisionWorkspace'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { trackEvents } from '@/lib/analytics'
import { parseCaseBriefing } from '@/lib/parse-case-template'
import { createClient } from '@/lib/supabase/client'
import { fetchFromStorage } from '@/lib/supabase/storage'
import { DecisionPoint, SimulationState, UserDecision } from '@/types/simulation.types'
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
  const supabase = createClient()
  
  const [state, setState] = useState<SimulationState>({
    currentDecisionPoint: 0,
    decisions: [],
    startedAt: simulation.started_at || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  })

  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch case JSON from Storage if storage_path exists
  useEffect(() => {
    async function loadCaseData() {
      setIsLoading(true)
      try {
        if (caseItem.storage_path) {
          // Fetch from Supabase Storage
          const { success, content, error } = await fetchFromStorage(caseItem.storage_path)
          
          if (success && content) {
            const parsed = JSON.parse(content)
            setCaseData(parsed)
          } else {
            console.error('Failed to fetch case from storage:', error)
            // Fall back to database data
            useFallbackData()
          }
        } else {
          // Use data from database
          useFallbackData()
        }
      } catch (error) {
        console.error('Error loading case data:', error)
        useFallbackData()
      } finally {
        setIsLoading(false)
      }
    }

    function useFallbackData() {
      // Construct case data from database fields
      setCaseData({
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
      })
    }

    loadCaseData()
  }, [caseItem])

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

  const handleDecisionComplete = async (decision: UserDecision) => {
    const newDecisions = [...state.decisions, decision]
    const newState: SimulationState = {
      ...state,
      decisions: newDecisions,
      currentDecisionPoint: state.currentDecisionPoint + 1,
      lastUpdated: new Date().toISOString(),
    }

    setState(newState)

    // Save to database
    try {
      const { error } = await supabase
        .from('simulations')
        .update({
          user_inputs: newState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', simulation.id)

      if (error) throw error
    } catch (error) {
      console.error('Failed to save progress:', error)
      toast.error('Failed to save your progress')
    }
  }

  const handleComplete = async () => {
    try {
      // Save final state first
      const { error: updateError } = await supabase
        .from('simulations')
        .update({
          user_inputs: state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', simulation.id)

      if (updateError) throw updateError

      // Complete simulation via API (handles forum thread creation and notifications)
      toast.loading('Completing simulation...')
      
      const completeResponse = await fetch(`/api/simulations/${simulation.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!completeResponse.ok) {
        throw new Error('Failed to complete simulation')
      }

      // Generate debrief with retry logic for transient 5xx errors
      toast.loading('Generating your performance debrief...')
      
      let debriefResponse: Response | null = null
      let retries = 0
      const maxRetries = 3
      const retryDelay = 1000 // 1 second

      while (retries <= maxRetries) {
        try {
          debriefResponse = await fetch('/api/generate-debrief', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ simulationId: simulation.id }),
          })

          if (debriefResponse.ok) {
            break
          }

          // Only retry on 5xx errors
          if (debriefResponse.status >= 500 && retries < maxRetries) {
            retries++
            await new Promise(resolve => setTimeout(resolve, retryDelay * retries))
            continue
          }

          throw new Error('Failed to generate debrief')
        } catch (error) {
          if (retries >= maxRetries) {
            throw error
          }
          // Retry on network errors too
          retries++
          await new Promise(resolve => setTimeout(resolve, retryDelay * retries))
        }
      }

      if (!debriefResponse || !debriefResponse.ok) {
        throw new Error('Failed to generate debrief after retries')
      }

      const { debriefId } = await debriefResponse.json()
      
      // Track simulation completion
      trackEvents.simulationCompleted(simulation.id, caseItem.id, userId)
      
      toast.success('Debrief generated!')
      router.push(`/debrief/${simulation.id}`)
    } catch (error) {
      console.error('Failed to complete simulation:', error)
      toast.error('Failed to complete simulation')
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-900 mb-2">Loading Case Study...</div>
          <div className="text-sm text-neutral-500">Please wait while we prepare your simulation.</div>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-900 mb-2">Failed to Load Case</div>
          <div className="text-sm text-red-600">Unable to load the case study data.</div>
        </div>
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
