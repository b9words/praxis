'use client'

import UniversalAssetViewer from '@/components/case-study/UniversalAssetViewer'
import DecisionWorkspace from '@/components/case-study/DecisionWorkspace'
import CaseStepper from '@/components/case-study/CaseStepper'
import NeedARefresher from '@/components/case-study/NeedARefresher'
import ErrorState from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { trackEvents } from '@/lib/analytics'
import { fetchJson } from '@/lib/api'
import { parseCaseBriefing } from '@/lib/parse-case-template'
import { queryKeys } from '@/lib/queryKeys'
import { DecisionPoint, SimulationState, UserDecision } from '@/types/simulation.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Home, ListChecks, FileText, ClipboardList } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ProgressModal, ProgressStep } from '@/components/ui/modals/ProgressModal'
import { ConfirmModal } from '@/components/ui/modals/ConfirmModal'
import { InlineBanner } from '@/components/ui/inline-banner'
import { toast } from 'sonner'
import MarkdownRenderer from '@/components/ui/Markdown'

interface CaseStudyWorkspaceProps {
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
  stages?: Array<{
    stageId?: string
    order?: number
    title?: string
    stageTitle?: string
    description: string
    challengeType?: string
    challengeData?: {
      options?: Array<{
        id: string
        title: string
        description: string
      }>
    }
    requiresPersona?: string
    rubricMapping?: string[]
  }>
  challenges?: Array<{
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

export default function CaseStudyWorkspace({
  caseItem,
  simulation,
  userId,
  softPaywallEnabled = false,
}: CaseStudyWorkspaceProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [state, setState] = useState<SimulationState>({
    currentDecisionPoint: 0,
    decisions: [],
    startedAt: simulation?.started_at || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  })
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([])
  const [progressStatus, setProgressStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [progressError, setProgressError] = useState<string>()
  const [saveStatus, setSaveStatus] = useState<{ status: 'saving' | 'saved' | null; timestamp?: Date }>({ status: null })
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null)
  const [leftPanelTab, setLeftPanelTab] = useState<'tasks' | 'files' | 'rubric'>('tasks')

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
    if (caseItem && simulation?.id && !isLoading) {
      trackEvents.simulationStarted(simulation.id, caseItem.id, userId)
    }
  }, [caseItem, simulation, userId, isLoading])

  // Parse case structure for briefing doc (backward compatibility)
  const briefingDoc = caseItem.briefingDoc || caseItem.briefing_doc || null
  const caseStructure = caseData?.briefing || parseCaseBriefing(briefingDoc)
  
  // Generate better fallback decision points if case data doesn't have stages/challenges
  const generateFallbackDecisionPoints = (): DecisionPoint[] => {
    const rubricKeys = Object.keys(caseItem.rubric?.criteria || {})
    const competencies = caseItem.competencies?.map((cc: any) => cc.competency?.name || 'Strategic Thinking') || ['Strategic Thinking']
    const primaryCompetency = competencies[0] || 'Strategic Thinking'
    
    // Generate 4-6 decision points with specific, thought-provoking prompts
    const decisionPoints: DecisionPoint[] = [
      {
        id: 'decision-1',
        order: 1,
        title: 'Initial Assessment & Problem Framing',
        description: `Based on the case information provided, identify the core strategic challenge. What are the key constraints, stakeholders, and decision criteria? Frame the problem in quantitative terms where possible, considering both short-term implications and long-term consequences.`,
        type: 'text' as const,
        rubricMapping: rubricKeys.length > 0 ? [rubricKeys[0]] : [],
      },
      {
        id: 'decision-2',
        order: 2,
        title: 'Strategic Options Analysis',
        description: `Evaluate at least three distinct strategic approaches. For each option, quantify the expected outcomes using available data. What are the trade-offs between competing objectives (e.g., growth vs. profitability, short-term vs. long-term value)? Which option best aligns with the organization's strategic priorities?`,
        type: 'multiple_choice' as const,
        options: [
          { id: 'opt-1', label: 'Option A: Aggressive Growth Strategy', value: 'Focus on rapid expansion and market share capture, accepting near-term margin compression' },
          { id: 'opt-2', label: 'Option B: Balanced Approach', value: 'Moderate growth with disciplined capital allocation and margin preservation' },
          { id: 'opt-3', label: 'Option C: Defensive Optimization', value: 'Prioritize efficiency, cost reduction, and cash flow generation over growth' },
          { id: 'opt-4', label: 'Option D: Strategic Pivot', value: 'Fundamentally reposition the business model or enter new markets' },
        ],
        rubricMapping: rubricKeys.length > 1 ? [rubricKeys[1]] : rubricKeys.slice(0, 1),
      },
      {
        id: 'decision-3',
        order: 3,
        title: 'Resource Allocation & Sequencing',
        description: `Given limited resources, how would you prioritize and sequence implementation? Which initiatives should be funded first, and what is the minimum viable investment required? How do you balance competing resource demands across different business units or functions? Provide a quantitative rationale for your prioritization.`,
        type: 'text' as const,
        rubricMapping: rubricKeys.length > 2 ? [rubricKeys[2]] : rubricKeys.slice(0, 1),
      },
      {
        id: 'decision-4',
        order: 4,
        title: 'Risk Assessment & Mitigation',
        description: `Identify the top three risks associated with your recommended approach. For each risk, quantify the potential impact (financial, operational, reputational) and probability. What specific mitigation strategies would you implement, and how would you monitor early warning indicators?`,
        type: 'text' as const,
        rubricMapping: rubricKeys.length > 3 ? [rubricKeys[3]] : rubricKeys.slice(0, 1),
      },
      {
        id: 'decision-5',
        order: 5,
        title: 'Stakeholder Management',
        description: `How would you communicate your decision to key stakeholders (board, investors, employees, customers)? What objections are you most likely to encounter, and how would you address them? If stakeholder alignment is critical, which stakeholders would you engage first and why?`,
        type: 'role_play' as const,
        requiresPersona: caseStructure?.keyStakeholders?.[0]?.id || undefined,
        rubricMapping: rubricKeys.length > 4 ? [rubricKeys[4]] : rubricKeys.slice(0, 1),
      },
      {
        id: 'decision-6',
        order: 6,
        title: 'Final Recommendation & Implementation Plan',
        description: `Synthesize your analysis into a clear, actionable recommendation. What are the specific next steps, timeline, and success metrics? How will you measure progress and adjust course if needed? Provide a quantitative business case supporting your recommendation.`,
        type: 'text' as const,
        rubricMapping: rubricKeys.slice(-1),
      },
    ]
    
    // Return 4-6 points (adjust based on available rubric criteria)
    return decisionPoints.slice(0, Math.min(6, Math.max(4, rubricKeys.length || 4)))
  }

  // Get decision points from case data, or use improved fallback
  const decisionPoints: DecisionPoint[] = (caseData?.challenges as DecisionPoint[]) || 
    (caseData?.stages ? 
      (caseData.stages as any[]).map((stage: any, idx: number) => {
        // Determine type: multiple_choice if options exist, role_play if requiresPersona, else text
        const hasOptions = stage.challengeData?.options && Array.isArray(stage.challengeData.options) && stage.challengeData.options.length > 0
        const type = hasOptions 
          ? 'multiple_choice' as const
          : stage.requiresPersona 
            ? 'role_play' as const
            : 'text' as const
        
        // Use prompt from challengeData if available, otherwise use description
        const description = stage.challengeData?.prompt || stage.description || ''
        
        return {
          id: stage.stageId || `stage-${idx + 1}`,
          order: stage.order || idx + 1,
          title: stage.title || stage.stageTitle || `Decision Point ${idx + 1}`,
          description,
          type,
          options: hasOptions ? stage.challengeData.options.map((opt: any) => ({
            id: opt.id,
            label: opt.title,
            value: opt.description,
          })) : undefined,
          requiresPersona: stage.requiresPersona,
          rubricMapping: stage.rubricMapping || Object.keys(caseItem.rubric?.criteria || {}),
        }
      }) as DecisionPoint[]
      : generateFallbackDecisionPoints())

  // Load existing state from simulation (check both new and legacy paths)
  useEffect(() => {
    if (!simulation) return
    
    // Try new path first: userInputs.stageStates.simulationState
    const userInputs = (simulation.userInputs || simulation.user_inputs) as any
    if (userInputs && typeof userInputs === 'object') {
      const stageStates = userInputs.stageStates || {}
      const simulationState = stageStates.simulationState
      
      if (simulationState && simulationState.decisions && Array.isArray(simulationState.decisions)) {
        setState(prev => ({
          ...prev,
          decisions: simulationState.decisions,
          currentDecisionPoint: simulationState.currentDecisionPoint ?? prev.currentDecisionPoint,
          startedAt: simulationState.startedAt || prev.startedAt,
          lastUpdated: simulationState.lastUpdated || prev.lastUpdated,
        }))
        return
      }
      
      // Fallback to legacy path: user_inputs.decisions
      if (userInputs.decisions && Array.isArray(userInputs.decisions)) {
        setState(prev => ({
          ...prev,
          decisions: userInputs.decisions,
          currentDecisionPoint: userInputs.currentDecisionPoint || 0,
        }))
      }
    }
  }, [simulation?.userInputs, simulation?.user_inputs])

  // Mutation for saving simulation state
  const saveStateMutation = useMutation({
    mutationFn: (newState: SimulationState) => {
      if (!simulation?.id) {
        // Simulation should always exist after unification, but guard for safety
        return Promise.reject(new Error('Simulation not available. Please refresh the page.'))
      }
      return fetchJson(`/api/case-studies/${simulation.id}/state`, {
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
      })
    },
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
      setShowProgressModal(true)
      setProgressStatus('processing')
      setProgressSteps([
        { label: 'Queued', status: 'completed' },
        { label: 'Processing', status: 'active' },
        { label: 'Completed', status: 'pending' },
      ])

      const response = await fetchJson<{ 
        debriefId?: string
        jobId?: string
        status?: string
        fromCache?: boolean
        debrief?: any
      }>('/api/generate-debrief', {
        method: 'POST',
        body: { simulationId: simulation?.id },
      })

      // If debrief already exists (from cache), return immediately
      if (response.debriefId || response.fromCache) {
        setProgressSteps([
          { label: 'Queued', status: 'completed' },
          { label: 'Processing', status: 'completed' },
          { label: 'Completed', status: 'completed' },
        ])
        setProgressStatus('success')
        return { debriefId: response.debriefId || response.debrief?.id }
      }

      // If job was created, poll for completion with progress updates
      if (response.jobId) {
        const jobId = response.jobId
        const maxAttempts = 60 // Poll for up to 60 seconds (1 minute)
        const pollInterval = 1000 // Poll every 1 second

        setProgressSteps([
          { label: 'Queued', status: 'completed' },
          { label: 'Processing', status: 'active' },
          { label: 'Completed', status: 'pending' },
        ])

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
            setProgressSteps([
              { label: 'Queued', status: 'completed' },
              { label: 'Processing', status: 'completed' },
              { label: 'Completed', status: 'completed' },
            ])
            setProgressStatus('success')
            // Extract debriefId from result
            const debriefId = jobStatus.result?.debriefId || jobStatus.result?.debrief?.id
            if (debriefId) {
              return { debriefId }
            }
            // Fallback: use simulationId to fetch debrief
            return { debriefId: simulation?.id }
          } else if (jobStatus.status === 'failed') {
            setProgressSteps([
              { label: 'Queued', status: 'completed' },
              { label: 'Processing', status: 'error' },
              { label: 'Completed', status: 'pending' },
            ])
            setProgressStatus('error')
            throw new Error(jobStatus.error || 'Debrief generation failed')
          }
          // Continue polling if status is 'pending' or 'processing'
        }

        // If we've exhausted all attempts, throw error
        setProgressSteps([
          { label: 'Queued', status: 'completed' },
          { label: 'Processing', status: 'error' },
          { label: 'Completed', status: 'pending' },
        ])
        setProgressStatus('error')
        throw new Error('Debrief generation timed out. Please check back later.')
      }

      // Fallback: if no jobId or debriefId, something went wrong
      setProgressStatus('error')
      throw new Error('Unexpected response from debrief generation')
    },
    onSuccess: (data) => {
      if (!simulation?.id) return
      // Track simulation completion
      trackEvents.simulationCompleted(simulation.id, caseItem.id, userId)
      
      // Invalidate debrief queries
      queryClient.invalidateQueries({ queryKey: queryKeys.debriefs.bySimulation(simulation.id) })
      
      // Auto-close modal after brief delay, then redirect
      setTimeout(() => {
        setShowProgressModal(false)
        const caseId = (caseItem.metadata as any)?.caseId || caseItem.id
        router.push(`/library/case-studies/${caseId}/debrief`)
      }, 1500)
    },
    onError: (error) => {
      setProgressError(error instanceof Error ? error.message : 'Failed to generate debrief')
      // Modal stays open showing error
    },
    retry: 0, // Don't retry - we handle polling ourselves
  })

  // Mutation for publishing response
  const publishResponseMutation = useMutation({
    mutationFn: async (data: { content: string; isPublic: boolean }) => {
      // Use metadata.caseId (slug) for URL, API will resolve to database ID
      const caseId = (caseItem.metadata as any)?.caseId || caseItem.id
      return fetchJson(`/api/case-studies/${caseId}/responses`, {
        method: 'POST',
        body: {
          content: data.content,
          isPublic: data.isPublic,
          simulationId: simulation?.id,
        },
      })
    },
    onSuccess: () => {
      setInlineSuccess('Response published successfully!')
      setTimeout(() => setInlineSuccess(null), 5000)
    },
    onError: (error) => {
      setInlineSuccess(null)
      // Error will be shown via inline banner
    },
  })

  // Mutation for completing simulation
  const completeMutation = useMutation({
    mutationFn: () => {
      if (!simulation?.id) {
        // Simulation should always exist after unification, but guard for safety
        return Promise.reject(new Error('Simulation not available. Please refresh the page.'))
      }
      return fetchJson<{ success: boolean; alreadyCompleted?: boolean }>(`/api/case-studies/${simulation.id}/complete`, {
        method: 'POST',
      })
    },
    onSuccess: (data) => {
      if (!simulation?.id) return
      // Invalidate simulation queries to refresh UI
      queryClient.invalidateQueries({ queryKey: queryKeys.simulations.byId(simulation.id) })
      
      // If already completed, don't show publish modal - just refresh to show completed state
      if (data.alreadyCompleted) {
        return
      }
      
      // Show publish modal before generating debrief
      setShowPublishModal(true)
    },
    onError: (error) => {
      setInlineSuccess(null)
      // Error will be shown via inline banner
    },
  })

  // Compile response content from decisions
  const compileResponseContent = (): string => {
    const parts: string[] = []
    
    decisionPoints.forEach((dp, idx) => {
      const decision = state.decisions.find(d => d.decisionPointId === dp.id)
      if (decision) {
        parts.push(`## ${dp.title}\n\n`)
        if (decision.selectedOption && dp.options) {
          const option = dp.options.find(opt => opt.id === decision.selectedOption)
          if (option) {
            parts.push(`**Selected Option:** ${option.label}\n\n${option.value}\n\n`)
          }
        }
        parts.push(`**Analysis:**\n${decision.justification}\n\n`)
        if (decision.rolePlayTranscript && decision.rolePlayTranscript.length > 0) {
          parts.push(`**Stakeholder Discussion:**\n`)
          decision.rolePlayTranscript.forEach(msg => {
            parts.push(`${msg.role === 'user' ? 'You' : 'Stakeholder'}: ${msg.message}\n`)
          })
          parts.push(`\n`)
        }
      }
    })
    
    return parts.join('')
  }

  const handlePublishAndContinue = async () => {
    try {
      const content = compileResponseContent()
      await publishResponseMutation.mutateAsync({
        content,
        isPublic: isPublic,
      })
      
      setShowPublishModal(false)
      
      // Generate debrief after publishing
      generateDebriefMutation.mutate()
    } catch (error) {
      console.error('Failed to publish response:', error)
    }
  }

  const handleSkipPublish = () => {
    setShowPublishModal(false)
    // Generate debrief without publishing
    generateDebriefMutation.mutate()
  }

  const handleComplete = () => {
    // Show confirm modal first
    setShowSubmitConfirm(true)
  }

  const handleConfirmComplete = async () => {
    setShowSubmitConfirm(false)
    try {
      // Save final state first
      await saveStateMutation.mutateAsync(state)
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

  // Check if case is completed
  const isCompleted = simulation?.status === 'completed'
  const caseId = (caseItem.metadata as any)?.caseId || caseItem.id

  // If completed, show completed state with response preview
  if (isCompleted) {
    return (
      <div className="h-full flex flex-col">
        {/* HEADER: Title, Breadcrumb */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 uppercase tracking-wide">
            <Link href="/dashboard" className="hover:text-gray-700 font-medium flex items-center gap-1">
              <Home className="h-3 w-3" />
              Dashboard
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/library/case-studies" className="hover:text-gray-700 font-medium">
              Case Studies
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-medium">{caseData?.title || caseItem.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{caseData?.title || caseItem.title}</h1>
              <p className="text-sm text-gray-600 mt-1">Case Study Completed</p>
            </div>
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
              <Link href={`/library/case-studies/${caseId}/debrief`}>View Debrief</Link>
            </Button>
          </div>
        </div>

        {/* MAIN CONTENT: Resizable Panels */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* LEFT PANEL: Case Files & Data */}
            <ResizablePanel defaultSize={60} minSize={30} maxSize={70}>
              <div className="h-full min-h-0 flex flex-col">
                {showNeedARefresher && (
                  <div className="p-4 border-b border-neutral-200 flex-shrink-0">
                    <NeedARefresher 
                      competencies={competencies}
                      caseId={caseItem.id}
                      recommendedLessons={recommendedLessons}
                    />
                  </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <UniversalAssetViewer
                    briefingDoc={caseItem.briefingDoc || caseItem.briefing_doc || null}
                    datasets={caseItem.datasets}
                    caseFiles={caseItem.files}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* RIGHT PANEL: Your Response Preview */}
            <ResizablePanel defaultSize={40} minSize={30} maxSize={70}>
              <div className="h-full min-h-0 flex flex-col bg-gray-50">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
                  <h2 className="text-lg font-medium text-gray-900">Your Response</h2>
                  <p className="text-sm text-gray-600 mt-1">Review your completed analysis</p>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                    {state.decisions.length === 0 ? (
                      <p className="text-sm text-gray-600">No responses recorded.</p>
                    ) : (
                      state.decisions.map((decision, idx) => {
                        const decisionPoint = decisionPoints.find(dp => dp.id === decision.decisionPointId)
                        if (!decisionPoint) return null
                        
                        return (
                          <div key={decision.decisionPointId} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                            <h3 className="font-medium text-gray-900 mb-2">
                              {decisionPoint.title}
                            </h3>
                            {decision.selectedOption && decisionPoint.options && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">Selected Option:</p>
                                <p className="text-sm text-gray-600">
                                  {decisionPoint.options.find(opt => opt.id === decision.selectedOption)?.label || decision.selectedOption}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Your Analysis:</p>
                              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                {decision.justification}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-200 bg-white p-4">
                  <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none">
                    <Link href={`/library/case-studies/${caseId}/debrief`}>View Full Debrief & Feedback</Link>
                  </Button>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    )
  }

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
          <Link href="/library/case-studies" className="hover:text-gray-700 font-medium">
            Case Studies
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

      {/* MAIN CONTENT: Two-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* LEFT PANEL: Context Panel with Tabs (30% default) */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <div className="h-full min-h-0 flex flex-col bg-white border-r border-neutral-200">
              <Tabs value={leftPanelTab} onValueChange={(v) => setLeftPanelTab(v as 'tasks' | 'files' | 'rubric')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-neutral-200 bg-white h-auto">
                  <TabsTrigger value="tasks" className="rounded-none data-[state=active]:bg-neutral-50 data-[state=active]:border-b-2 data-[state=active]:border-neutral-900">
                    <ListChecks className="h-3 w-3 mr-2" />
                    <span className="text-xs">Tasks</span>
                  </TabsTrigger>
                  <TabsTrigger value="files" className="rounded-none data-[state=active]:bg-neutral-50 data-[state=active]:border-b-2 data-[state=active]:border-neutral-900">
                    <FileText className="h-3 w-3 mr-2" />
                    <span className="text-xs">Case Files</span>
                  </TabsTrigger>
                  <TabsTrigger value="rubric" className="rounded-none data-[state=active]:bg-neutral-50 data-[state=active]:border-b-2 data-[state=active]:border-neutral-900">
                    <ClipboardList className="h-3 w-3 mr-2" />
                    <span className="text-xs">Rubric</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="tasks" className="flex-1 min-h-0 overflow-y-auto m-0 p-4">
                  <CaseStepper
                    decisionPoints={decisionPoints}
                    currentIndex={state.currentDecisionPoint}
                    decisions={state.decisions}
                    onStepClick={(index) => {
                      if (index <= state.currentDecisionPoint) {
                        setState(prev => ({ ...prev, currentDecisionPoint: index }))
                      }
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="files" className="flex-1 min-h-0 overflow-y-auto m-0 p-0">
                  {showNeedARefresher && (
                    <div className="p-4 border-b border-neutral-200 flex-shrink-0">
                      <NeedARefresher 
                        competencies={competencies}
                        caseId={caseItem.id}
                        recommendedLessons={recommendedLessons}
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <UniversalAssetViewer
                      briefingDoc={caseItem.briefingDoc || caseItem.briefing_doc || null}
                      datasets={caseItem.datasets}
                      caseFiles={caseItem.files}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="rubric" className="flex-1 min-h-0 overflow-y-auto m-0 p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900 mb-2">
                        Scoring Guide: {decisionPoints[state.currentDecisionPoint]?.title || 'Current Task'}
                      </h3>
                      {caseItem.rubric && (
                        <div className="prose prose-sm max-w-none">
                          {typeof caseItem.rubric === 'string' ? (
                            <MarkdownRenderer content={caseItem.rubric} />
                          ) : caseItem.rubric.criteria ? (
                            <div className="space-y-4">
                              {Object.entries(caseItem.rubric.criteria).map(([key, value]: [string, any]) => (
                                <div key={key} className="border border-neutral-200 p-3">
                                  <h4 className="text-xs font-medium text-neutral-900 mb-2">{key}</h4>
                                  {typeof value === 'string' ? (
                                    <MarkdownRenderer content={value} />
                                  ) : value.description ? (
                                    <p className="text-xs text-neutral-700">{value.description}</p>
                                  ) : (
                                    <pre className="text-xs text-neutral-600">{JSON.stringify(value, null, 2)}</pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <pre className="text-xs text-neutral-600">{JSON.stringify(caseItem.rubric, null, 2)}</pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* RIGHT PANEL: Workspace Panel (70% default) */}
          <ResizablePanel defaultSize={70} minSize={60} maxSize={80}>
            <div className="h-full min-h-0 flex flex-col bg-white">
              {/* Task Prompt Header */}
              {decisionPoints[state.currentDecisionPoint] && (
                <div className="border-b border-neutral-200 p-4 bg-neutral-50 flex-shrink-0">
                  <h2 className="text-base font-medium text-neutral-900 mb-2">
                    {decisionPoints[state.currentDecisionPoint].title}
                  </h2>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {decisionPoints[state.currentDecisionPoint].description}
                  </p>
                </div>
              )}
              
              {/* Decision Workspace */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <DecisionWorkspace
                  decisionPoints={decisionPoints}
                  personas={caseStructure?.keyStakeholders || []}
                  currentIndex={state.currentDecisionPoint}
                  decisions={state.decisions}
                  onDecisionComplete={handleDecisionComplete}
                  onComplete={handleComplete}
                  softPaywallEnabled={softPaywallEnabled}
                  rubric={caseItem.rubric}
                  currentDecisionPoint={decisionPoints[state.currentDecisionPoint]}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Publish Response Modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-gray-900">
              Share Your Response
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              Your analysis has been completed. Would you like to share your response with the community?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Response Preview</h4>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {compileResponseContent().substring(0, 500)}
                {compileResponseContent().length > 500 && '...'}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="isPublic"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="isPublic" className="text-sm font-medium text-gray-900 cursor-pointer">
                  Make my response public
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Other users will be able to view and upvote your response. You can always update this later.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleSkipPublish}
              className="w-full sm:w-auto border-gray-300 hover:border-gray-400 rounded-none"
            >
              Skip & View Debrief
            </Button>
            <Button
              onClick={handlePublishAndContinue}
              disabled={publishResponseMutation.isPending}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white rounded-none"
            >
              {publishResponseMutation.isPending ? 'Publishing...' : 'Publish & View Debrief'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal for Debrief Generation */}
      <ProgressModal
        open={showProgressModal}
        onOpenChange={setShowProgressModal}
        title="Generating Debrief"
        description="Analyzing your decision and preparing personalized feedback..."
        steps={progressSteps}
        status={progressStatus}
        errorMessage={progressError}
        cancellable={progressStatus === 'processing'}
        onCancel={() => {
          setShowProgressModal(false)
          setProgressStatus('processing')
          setProgressError(undefined)
        }}
      />

      {/* Confirm Modal for Submit */}
      <ConfirmModal
        open={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        title="Submit Final Decision?"
        description="This will finalize your case study submission. You'll be able to view your debrief and share your response with the community."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        onConfirm={handleConfirmComplete}
        isLoading={completeMutation.isPending}
      />

      {/* Inline Success Banner */}
      {inlineSuccess && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <InlineBanner
            variant="success"
            message={inlineSuccess}
            dismissible
            onDismiss={() => setInlineSuccess(null)}
            autoDismiss={5000}
          />
        </div>
      )}

      {/* Inline Save Status */}
      {saveStatus.status && (
        <div className="fixed top-20 right-4 z-40">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs text-gray-600">
            {saveStatus.status === 'saving' && 'Saving...'}
            {saveStatus.status === 'saved' && saveStatus.timestamp && (
              `Saved ${Math.round((Date.now() - saveStatus.timestamp.getTime()) / 1000)}s ago`
            )}
          </div>
        </div>
      )}
    </div>
  )
}
