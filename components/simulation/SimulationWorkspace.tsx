'use client'

import CaseFileViewer from '@/components/simulation/CaseFileViewer'
import DecisionWorkspace from '@/components/simulation/DecisionWorkspace'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
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

  // Parse case structure for briefing doc (backward compatibility)
  const caseStructure = caseData?.briefing || parseCaseBriefing(caseItem.briefing_doc)
  
  // Get decision points from case data
  const decisionPoints: DecisionPoint[] = caseData?.challenges || [
    {
      id: 'decision-1',
      order: 1,
      title: 'Analyze the Situation',
      description: 'Based on the case information and data provided, what is your recommended approach?',
      type: 'text',
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
      // Mark simulation as completed
      const { error: updateError } = await supabase
        .from('simulations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          user_inputs: state,
        })
        .eq('id', simulation.id)

      if (updateError) throw updateError

      // Generate debrief
      toast.loading('Generating your performance debrief...')
      
      const response = await fetch('/api/generate-debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulationId: simulation.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate debrief')
      }

      const { debriefId } = await response.json()
      
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
