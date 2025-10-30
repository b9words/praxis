'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChallengeBlock, useCaseStudyStore } from '@/lib/case-study-store'
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import DocumentViewerBlock from '../blocks/DocumentViewerBlock'
import FinancialModelBlock from '../blocks/FinancialModelBlock'
import PromptBoxBlock from '../blocks/PromptBoxBlock'
import RichTextEditorBlock from '../blocks/RichTextEditorBlock'
import SubmitButtonBlock from '../blocks/SubmitButtonBlock'

interface MultiStageLayoutProps {
  challengeData: {
    stages: Array<{
      stageId: string
      title: string
      description: string
      blocks: ChallengeBlock[]
      dependencies?: string[] // Previous stages that must be completed
    }>
    [key: string]: any
  }
}

const challengeBlockMap = {
  PROMPT_BOX: PromptBoxBlock,
  RICH_TEXT_EDITOR: RichTextEditorBlock,
  SUBMIT_BUTTON: SubmitButtonBlock,
  DOCUMENT_VIEWER: DocumentViewerBlock,
  FINANCIAL_MODEL: FinancialModelBlock,
}

export default function MultiStageLayout({ challengeData }: MultiStageLayoutProps) {
  const { stages = [] } = challengeData
  const { getAllBlockStates, currentStageId } = useCaseStudyStore()
  const [currentSubStage, setCurrentSubStage] = useState(0)

  if (stages.length === 0) {
    return (
      <div className="w-full">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <p className="text-red-700">No stages defined for this multi-stage challenge.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStage = stages[currentSubStage]
  const totalStages = stages.length
  const progressPercentage = ((currentSubStage + 1) / totalStages) * 100

  // Check if current stage dependencies are met
  const canAccessStage = (stageIndex: number) => {
    if (stageIndex === 0) return true
    
    const stage = stages[stageIndex]
    if (!stage.dependencies) return stageIndex <= currentSubStage + 1
    
    // Check if all dependency stages are completed
    return stage.dependencies.every(depStageId => {
      const depStageIndex = stages.findIndex(s => s.stageId === depStageId)
      if (depStageIndex === -1) return false
      
      // Check if the dependency stage has completed blocks
      const blockStates = getAllBlockStates(currentStageId || '')
      const depStageBlocks = stages[depStageIndex].blocks
      
      return depStageBlocks.every(block => {
        const blockState = blockStates[`${depStageId}_${block.blockId}`]
        return blockState && blockState.isValid !== false
      })
    })
  }

  const isStageCompleted = (stageIndex: number) => {
    const stage = stages[stageIndex]
    const blockStates = getAllBlockStates(currentStageId || '')
    
    return stage.blocks.every(block => {
      const blockState = blockStates[`${stage.stageId}_${block.blockId}`]
      return blockState && blockState.content && blockState.isValid !== false
    })
  }

  const handleStageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSubStage > 0) {
      setCurrentSubStage(currentSubStage - 1)
    } else if (direction === 'next' && currentSubStage < totalStages - 1) {
      if (canAccessStage(currentSubStage + 1)) {
        setCurrentSubStage(currentSubStage + 1)
      }
    }
  }

  return (
    <div className="w-full">
      {/* Multi-Stage Header */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-blue-900">
                Multi-Stage Challenge: {currentStage.title}
              </CardTitle>
              <CardDescription className="text-blue-700 mt-1">
                {currentStage.description}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-900">
                Stage {currentSubStage + 1} of {totalStages}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Stage Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const isActive = index === currentSubStage
            const isCompleted = isStageCompleted(index)
            const canAccess = canAccessStage(index)
            
            return (
              <Button
                key={stage.stageId}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => canAccess && setCurrentSubStage(index)}
                disabled={!canAccess}
                className={`flex-shrink-0 ${
                  isCompleted ? 'border-green-500 bg-green-50 text-green-700' : ''
                } ${!canAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="mr-2">{index + 1}</span>
                {stage.title}
                {isCompleted && (
                  <CheckCircle className="ml-2 h-3 w-3 text-green-600" />
                )}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Current Stage Content */}
      <div className="space-y-6">
        {currentStage.blocks.map((block) => {
          const BlockComponent = challengeBlockMap[block.blockType as keyof typeof challengeBlockMap]
          
          if (!BlockComponent) {
            console.warn(`Unknown block type: ${block.blockType}`)
            return null
          }

          // Prefix block ID with stage ID to avoid conflicts
          const prefixedBlockId = `${currentStage.stageId}_${block.blockId}`

          return (
            <BlockComponent
              key={prefixedBlockId}
              blockId={prefixedBlockId}
              {...block.props}
            />
          )
        })}
      </div>

      {/* Stage Navigation Footer */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => handleStageNavigation('prev')}
          disabled={currentSubStage === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Stage
        </Button>

        <div className="text-sm text-neutral-600">
          {isStageCompleted(currentSubStage) ? (
            <span className="text-green-600 font-medium">Stage Complete ✓</span>
          ) : (
            <span>Complete this stage to continue</span>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => handleStageNavigation('next')}
          disabled={currentSubStage === totalStages - 1 || !canAccessStage(currentSubStage + 1)}
        >
          Next Stage
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
