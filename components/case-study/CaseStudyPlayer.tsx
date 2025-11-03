'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSimulationPersistence } from '@/hooks/useSimulationPersistence'
import { useCaseStudyStore } from '@/lib/case-study-store'
import { ChevronLeft, ChevronRight, Clock, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import CaseStudyLayout from './CaseStudyLayout'
import BoardDeckCritiqueLayout from './layouts/BoardDeckCritiqueLayout'
import EarningsCallQALayout from './layouts/EarningsCallQALayout'
import FinancialModelingLayout from './layouts/FinancialModelingLayout'
import MultiStageLayout from './layouts/MultiStageLayout'
import NegotiationLayout from './layouts/NegotiationLayout'
import StrategicOptionsLayout from './layouts/StrategicOptionsLayout'
import WrittenAnalysisLayout from './layouts/WrittenAnalysisLayout'

const challengeLayoutMap = {
  // Direct challenge type mappings
  STRATEGIC_OPTIONS: StrategicOptionsLayout,
  WRITTEN_ANALYSIS: WrittenAnalysisLayout,
  BOARD_DECK_CRITIQUE: BoardDeckCritiqueLayout,
  EARNINGS_CALL_QA: EarningsCallQALayout,
  FINANCIAL_MODELING: FinancialModelingLayout,
  MULTI_STAGE: MultiStageLayout,
  NEGOTIATION: NegotiationLayout,
  // Legacy mapping for backward compatibility (used in active case studies)
  STRATEGIC_OPTIONS_TRIAGE: StrategicOptionsLayout,
}

interface CaseStudyPlayerProps {
  className?: string
  simulationId?: string | null
}

export default function CaseStudyPlayer({ className = '', simulationId = null }: CaseStudyPlayerProps) {
  const {
    caseStudyData,
    currentStageId,
    stageStates,
    timer,
    getCurrentStage,
    setCurrentStage,
    canProceedToStage,
    isStageCompleted,
    updateTimer,
    logEvent,
    reset
  } = useCaseStudyStore()

  const [isInitialized, setIsInitialized] = useState(false)

  // Auto-save simulation state to database
  useSimulationPersistence(simulationId)

  // Timer update effect
  useEffect(() => {
    if (!timer.isRunning) return

    const interval = setInterval(() => {
      updateTimer()
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.isRunning, updateTimer])

  // Initialize case study
  useEffect(() => {
    if (caseStudyData && !isInitialized) {
      setIsInitialized(true)
      logEvent('PLAYER_INITIALIZED', undefined, { caseId: caseStudyData.caseId })
    }
  }, [caseStudyData, isInitialized, logEvent])

  if (!caseStudyData) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Case Study Loaded</CardTitle>
            <CardDescription>
              Please select a case study to begin the simulation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentStage = getCurrentStage()
  const currentStageIndex = caseStudyData.stages.findIndex(s => s.stageId === currentStageId)
  const totalStages = caseStudyData.stages.length
  const completedStages = Object.values(stageStates).filter(s => s.status === 'completed').length
  const progressPercentage = (completedStages / totalStages) * 100

  const canGoToPrevious = currentStageIndex > 0
  const canGoToNext = currentStageIndex < totalStages - 1 && 
    canProceedToStage(caseStudyData.stages[currentStageIndex + 1]?.stageId)

  const handlePreviousStage = () => {
    if (canGoToPrevious) {
      const previousStage = caseStudyData.stages[currentStageIndex - 1]
      setCurrentStage(previousStage.stageId)
    }
  }

  const handleNextStage = () => {
    if (canGoToNext) {
      const nextStage = caseStudyData.stages[currentStageIndex + 1]
      setCurrentStage(nextStage.stageId)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the entire case study? All progress will be lost.')) {
      reset()
      logEvent('CASE_RESET', undefined, { caseId: caseStudyData.caseId })
    }
  }

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!currentStage) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Case Study Complete</CardTitle>
            <CardDescription>
              You have completed all stages of this case study.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReset} variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get the appropriate layout component
  const LayoutComponent = challengeLayoutMap[currentStage.challengeType as keyof typeof challengeLayoutMap] ||
    challengeLayoutMap[currentStage.challengeLayout as keyof typeof challengeLayoutMap]

  if (!LayoutComponent) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Unknown Challenge Type</CardTitle>
            <CardDescription className="text-red-700">
              Challenge type "{currentStage.challengeType}" is not supported.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const headerContent = (
    <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Case Info */}
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-neutral-900 mb-1">
              {caseStudyData.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span>Stage {currentStageIndex + 1} of {totalStages}</span>
              <span>•</span>
              <span>{currentStage.stageTitle}</span>
              {timer.isRunning && timer.remaining && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono">
                      {formatTime(timer.remaining)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-neutral-900">
                {Math.round(progressPercentage)}% Complete
              </div>
              <div className="text-xs text-neutral-500">
                {completedStages} of {totalStages} stages
              </div>
            </div>
            <Progress value={progressPercentage} className="w-32" />
          </div>
        </div>
      </div>
    </div>
  )

  const footerContent = (
    <div className="sticky bottom-0 bg-white border-t border-neutral-200 shadow-lg">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Stage Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousStage}
              disabled={!canGoToPrevious}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextStage}
              disabled={!canGoToNext}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Stage Status */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-600">
              Status: <span className={`font-medium ${
                currentStageId && stageStates[currentStageId]?.status === 'completed' ? 'text-green-600' :
                currentStageId && stageStates[currentStageId]?.status === 'in_progress' ? 'text-blue-600' :
                'text-neutral-500'
              }`}>
                {currentStageId && stageStates[currentStageId]?.status?.replace('_', ' ') || 'Not Started'}
              </span>
            </div>
            
            {currentStageId && isStageCompleted(currentStageId) && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <Play className="h-4 w-4" />
                <span>Stage Complete</span>
              </div>
            )}
          </div>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={className}>
      <CaseStudyLayout
        header={headerContent}
        footer={footerContent}
      >
        <LayoutComponent challengeData={currentStage.challengeData as any} />
      </CaseStudyLayout>
    </div>
  )
}
