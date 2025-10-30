'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCaseStudyStore } from '@/lib/case-study-store'
import { AlertTriangle, CheckCircle, Clock, Send } from 'lucide-react'
import { useState } from 'react'

interface SubmitButtonBlockProps {
  blockId: string
  label?: string
  confirmationMessage?: string
  requiresValidation?: boolean
  validationRules?: {
    requiredBlocks?: string[]
    minWordCount?: number
    customValidation?: (stageData: any) => { isValid: boolean; message?: string }
  }
}

export default function SubmitButtonBlock({
  blockId,
  label = 'Submit Response',
  confirmationMessage,
  requiresValidation = true,
  validationRules
}: SubmitButtonBlockProps) {
  const { 
    currentStageId, 
    getStageState, 
    submitStageData, 
    getAllBlockStates,
    canProceedToStage 
  } = useCaseStudyStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  if (!currentStageId) return null

  const stageState = getStageState(currentStageId)
  const allBlockStates = getAllBlockStates(currentStageId)
  const isAlreadySubmitted = stageState.status === 'completed'

  // Validation logic
  const validateSubmission = () => {
    if (!requiresValidation) return { isValid: true }

    // Check required blocks
    if (validationRules?.requiredBlocks) {
      for (const requiredBlockId of validationRules.requiredBlocks) {
        const blockState = allBlockStates[requiredBlockId]
        if (!blockState || !blockState.content || blockState.content.trim() === '') {
          return {
            isValid: false,
            message: `Please complete the required field: ${requiredBlockId}`
          }
        }
      }
    }

    // Check minimum word count across all text blocks
    if (validationRules?.minWordCount) {
      let totalWords = 0
      Object.values(allBlockStates).forEach(blockState => {
        if (blockState.wordCount) {
          totalWords += blockState.wordCount
        }
      })
      
      if (totalWords < validationRules.minWordCount) {
        return {
          isValid: false,
          message: `Minimum ${validationRules.minWordCount} words required. Current: ${totalWords} words.`
        }
      }
    }

    // Custom validation
    if (validationRules?.customValidation) {
      const customResult = validationRules.customValidation(allBlockStates)
      if (!customResult.isValid) {
        return customResult
      }
    }

    // Check if all blocks are individually valid
    const invalidBlocks = Object.entries(allBlockStates).filter(
      ([_, blockState]) => blockState.isValid === false
    )
    
    if (invalidBlocks.length > 0) {
      return {
        isValid: false,
        message: `Please fix validation errors in: ${invalidBlocks.map(([id]) => id).join(', ')}`
      }
    }

    return { isValid: true }
  }

  const validation = validateSubmission()

  const handleSubmit = async () => {
    if (!validation.isValid) return

    if (confirmationMessage && !showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsSubmitting(true)
    
    try {
      // Collect all block data for submission
      const submissionData = {
        blockStates: allBlockStates,
        submittedAt: new Date().toISOString(),
        stageId: currentStageId
      }

      await submitStageData(currentStageId, submissionData)
      
      // Reset confirmation state
      setShowConfirmation(false)
    } catch (error) {
      console.error('Error submitting stage:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  if (isAlreadySubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Stage Completed Successfully</span>
          </div>
          <p className="text-sm text-green-600 text-center mt-2">
            Submitted on {new Date(stageState.completedAt || '').toLocaleString()}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (showConfirmation) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900 mb-2">Confirm Submission</h4>
              <p className="text-sm text-orange-700 mb-4">
                {confirmationMessage}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm Submit
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${validation.isValid ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {!validation.isValid && (
            <div className="flex items-start gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <p className="text-sm">{validation.message}</p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button
              onClick={handleSubmit}
              disabled={!validation.isValid || isSubmitting}
              size="lg"
              className={`${
                validation.isValid 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-neutral-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {label}
                </>
              )}
            </Button>
          </div>
          
          {validation.isValid && (
            <p className="text-xs text-center text-neutral-600">
              Ready to submit your response. This action cannot be undone.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}