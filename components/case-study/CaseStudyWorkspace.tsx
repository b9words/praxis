'use client'

import UniversalAssetViewer from '@/components/case-study/UniversalAssetViewer'
import DecisionWorkspace from '@/components/case-study/DecisionWorkspace'
import NeedARefresher from '@/components/case-study/NeedARefresher'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

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
    startedAt: simulation.started_at || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  })
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

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
      (caseData.stages as any[]).map((stage: any, idx: number) => ({
        id: stage.stageId || `stage-${idx + 1}`,
        order: stage.order || idx + 1,
        title: stage.title || stage.stageTitle || `Decision Point ${idx + 1}`,
        description: stage.description || '',
        type: (stage.challengeType === 'MULTIPLE_CHOICE' ? 'multiple_choice' : 
               stage.challengeType === 'ROLE_PLAY' ? 'role_play' : 'text') as 'text' | 'multiple_choice' | 'role_play',
        options: stage.challengeData?.options?.map((opt: any) => ({
          id: opt.id,
          label: opt.title,
          value: opt.description,
        })),
        requiresPersona: stage.requiresPersona,
        rubricMapping: stage.rubricMapping || Object.keys(caseItem.rubric?.criteria || {}),
      })) as DecisionPoint[]
      : generateFallbackDecisionPoints())

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
      fetchJson(`/api/case-studies/${simulation.id}/state`, {
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
          simulationId: simulation.id,
        },
      })
    },
    onSuccess: () => {
      toast.success('Response published successfully!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to publish response')
    },
  })

  // Mutation for completing simulation
  const completeMutation = useMutation({
      mutationFn: () => fetchJson<{ success: boolean }>(`/api/case-studies/${simulation.id}/complete`, {
      method: 'POST',
    }),
    onSuccess: () => {
      // Invalidate simulation queries
      queryClient.invalidateQueries({ queryKey: queryKeys.simulations.byId(simulation.id) })
      
      // Show publish modal before generating debrief
      setShowPublishModal(true)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete simulation')
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
      toast.loading('Generating your performance debrief...')
      generateDebriefMutation.mutate()
    } catch (error) {
      console.error('Failed to publish response:', error)
    }
  }

  const handleSkipPublish = () => {
    setShowPublishModal(false)
    // Generate debrief without publishing
    toast.loading('Generating your performance debrief...')
    generateDebriefMutation.mutate()
  }

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
    </div>
  )
}
