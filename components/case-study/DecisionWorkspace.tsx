'use client'

import AIPersonaChat from '@/components/case-study/AIPersonaChat'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DecisionPoint, Persona, UserDecision } from '@/types/simulation.types'
import { CheckCircle2, MessageSquare, Lock, Save, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { analytics } from '@/lib/analytics'
import { InlineBanner } from '@/components/ui/inline-banner'

interface DecisionWorkspaceProps {
  decisionPoints: DecisionPoint[]
  personas: Persona[]
  currentIndex: number
  decisions: UserDecision[]
  onDecisionComplete: (decision: UserDecision) => void
  onComplete: () => void
  softPaywallEnabled?: boolean
  rubric?: any
  currentDecisionPoint?: DecisionPoint
}

export default function DecisionWorkspace({
  decisionPoints,
  personas,
  currentIndex,
  decisions,
  onDecisionComplete,
  onComplete,
  softPaywallEnabled = false,
  rubric,
  currentDecisionPoint,
}: DecisionWorkspaceProps) {
  const currentDecision = decisionPoints[currentIndex] || currentDecisionPoint
  const [justification, setJustification] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [showPersonaChat, setShowPersonaChat] = useState(false)
  const [chatTranscript, setChatTranscript] = useState<Array<{ role: 'user' | 'ai'; message: string; timestamp: string }>>([])
  const [showPaywallModal, setShowPaywallModal] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Keyboard shortcuts for decision navigation (Alt+] and Alt+[)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      // Alt+] to go to next decision (if available)
      if (e.altKey && e.key === ']' && currentIndex < decisionPoints.length - 1) {
        e.preventDefault()
        // Note: Navigation would need to be handled by parent component
        // This prevents default behavior and could trigger a callback if added
        return
      }

      // Alt+[ to go to previous decision (if available)
      if (e.altKey && e.key === '[' && currentIndex > 0) {
        e.preventDefault()
        // Note: Navigation would need to be handled by parent component
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, decisionPoints.length])

  // Auto-save effect
  useEffect(() => {
    if (!justification.trim() || justification.length < 10) return

    const timeoutId = setTimeout(() => {
      setIsSaving(true)
      // Simulate autosave (in real implementation, this would call an API)
      setTimeout(() => {
        setLastSaved(new Date())
        setIsSaving(false)
      }, 500)
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId)
  }, [justification])

  if (!currentDecision) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 max-w-md w-full p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">All Decisions Complete</h2>
          <p className="text-sm text-gray-600 mb-6">All decision points have been completed in this simulation</p>
          <Button onClick={onComplete} className="w-full rounded-none bg-gray-900 hover:bg-gray-800 text-white" size="lg">
            Submit & View Debrief
          </Button>
        </div>
      </div>
    )
  }

  const persona = currentDecision.requiresPersona 
    ? personas.find(p => p.id === currentDecision.requiresPersona)
    : null

  // Quality check for justification
  const validateJustification = (text: string): { valid: boolean; error?: string } => {
    const trimmed = text.trim()
    
    // Minimum length check
    if (trimmed.length < 50) {
      return { valid: false, error: 'Justification must be at least 50 characters' }
    }
    
    // Minimum word count (at least 8 words)
    const words = trimmed.split(/\s+/).filter(w => w.length > 0)
    if (words.length < 8) {
      return { valid: false, error: 'Justification must contain at least 8 words' }
    }
    
    // Check for repeated characters (e.g., "aaaaa" or "11111")
    const hasRepeatedChars = /(.)\1{4,}/.test(trimmed)
    if (hasRepeatedChars) {
      return { valid: false, error: 'Justification appears to contain repeated characters' }
    }
    
    // Check for meaningful content (at least 30% alphabetic characters)
    const alphaChars = trimmed.match(/[a-zA-Z]/g)?.length || 0
    const alphaRatio = alphaChars / trimmed.length
    if (alphaRatio < 0.3) {
      return { valid: false, error: 'Justification must contain meaningful text' }
    }
    
    // Check for unique words (at least 50% unique words)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    const uniqueRatio = uniqueWords.size / words.length
    if (uniqueRatio < 0.5 && words.length > 10) {
      return { valid: false, error: 'Justification must contain varied vocabulary' }
    }
    
    return { valid: true }
  }

  const handleSubmit = () => {
    const validation = validateJustification(justification)
    if (!validation.valid) {
      setValidationError(validation.error || 'Please provide a more detailed justification')
      return
    }
    
    setValidationError(null) // Clear any previous errors

    // Check if soft paywall should trigger (on Stage 1 submission)
    if (softPaywallEnabled && currentIndex === 0 && decisions.length === 0) {
      setShowPaywallModal(true)
      return
    }

    const decision: UserDecision = {
      decisionPointId: currentDecision.id,
      selectedOption,
      justification: justification.trim(),
      rolePlayTranscript: chatTranscript.length > 0 ? chatTranscript : undefined,
    }

    // Track analytics
    analytics.track('case_decision_submitted', {
      decisionPointId: currentDecision.id,
      decisionIndex: currentIndex,
      hasPersonaChat: chatTranscript.length > 0,
    })

    onDecisionComplete(decision)
    setJustification('')
    setSelectedOption('')
    setChatTranscript([])
    setShowPersonaChat(false)
  }

  const validation = validateJustification(justification)
  const canSubmit = validation.valid

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Decision Point {String(currentIndex + 1).padStart(2, '0')}: {currentDecision.title}
          </span>
          <span className="text-sm text-gray-600">
            {decisions.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 h-2">
          <div
            className="bg-gray-900 h-2 transition-all duration-300"
            style={{ width: `${((currentIndex) / decisionPoints.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Decision prompt */}
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-medium text-gray-900">{currentDecision.title}</h2>
            <p className="text-sm text-gray-600 mt-2">{currentDecision.description}</p>
          </div>
        </div>

        {/* Persona interaction if required */}
        {persona && !showPersonaChat && (
          <div className="bg-white border border-gray-300">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-600" />
                Role-Play Required
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                You need to interact with <strong>{persona.name}</strong> ({persona.role}) before making your final decision.
              </p>
            </div>
            <div className="p-6">
              <Button onClick={() => setShowPersonaChat(true)} className="w-full rounded-none bg-gray-900 hover:bg-gray-800 text-white">
                Start Conversation with {persona.name}
              </Button>
            </div>
          </div>
        )}

        {/* Persona chat interface */}
        {showPersonaChat && persona && (
          <div className="bg-white border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-medium text-gray-900">Conversation with {persona.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{persona.role}</p>
            </div>
            <div className="p-6">
              <AIPersonaChat
                caseData={{}}
                personaName={persona.name}
                personaRole={persona.role}
                onComplete={() => setShowPersonaChat(false)}
              />
            </div>
          </div>
        )}

        {/* Multiple choice options */}
        {currentDecision.type === 'multiple_choice' && currentDecision.options && (
          <div className="bg-white border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-base font-medium text-gray-900">Select the optimal strategic path</h3>
            </div>
            <div className="p-6 space-y-2">
              {currentDecision.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`
                    w-full text-left p-4 border-2 transition-all
                    ${selectedOption === option.id 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      mt-0.5 h-5 w-5 border-2 flex items-center justify-center
                      ${selectedOption === option.id ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}
                    `}>
                      {selectedOption === option.id && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{option.value}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Justification */}
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-base font-medium text-gray-900">Your Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">
              Provide a detailed analysis that addresses the specific challenges and trade-offs outlined in the decision prompt. Use quantitative data where available to support your reasoning.
            </p>
          </div>
          <div className="p-6 space-y-4">
            {validationError && (
              <InlineBanner
                variant="error"
                message={validationError}
                dismissible
                onDismiss={() => setValidationError(null)}
              />
            )}
            <div className="space-y-2">
              <Label htmlFor="justification">
                Your Analysis (minimum 50 characters)
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => {
                  setJustification(e.target.value)
                  setValidationError(null) // Clear error on input
                }}
                placeholder="Provide a detailed analysis addressing the specific challenges, trade-offs, and quantitative factors relevant to this decision point."
                rows={8}
                className="resize-none rounded-none border-gray-300"
              />
              <p className="text-xs text-gray-600">
                {justification.length} / 50 minimum characters
              </p>
            </div>
          </div>
        </div>

        {/* Rubric - Show evaluation criteria */}
        {rubric && currentDecision?.rubricMapping && currentDecision.rubricMapping.length > 0 && (
          <div className="bg-neutral-50 border border-neutral-200">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h3 className="text-sm font-medium text-neutral-900">Evaluation Criteria</h3>
            </div>
            <div className="p-6 space-y-3">
              {currentDecision.rubricMapping.map((criteriaKey: string) => {
                const criteria = rubric.criteria?.[criteriaKey]
                if (!criteria) return null
                return (
                  <div key={criteriaKey} className="text-sm">
                    <div className="font-medium text-neutral-900 mb-1">
                      {criteria.name || criteriaKey}
                    </div>
                    {criteria.description && (
                      <div className="text-xs text-neutral-600">
                        {criteria.description}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Autosave status and action buttons */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
        {/* Autosave status */}
        {lastSaved && (
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            {isSaving ? (
              <>
                <Clock className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                <span>Autosaved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // Save draft functionality
              setLastSaved(new Date())
            }}
            size="sm"
            className="flex-1 rounded-none border-gray-300 hover:border-gray-400"
          >
            <Save className="h-3 w-3 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="sm"
            className="flex-1 rounded-none bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400 disabled:text-white"
          >
            {currentIndex < decisionPoints.length - 1
              ? 'Continue'
              : 'Submit for Feedback'}
          </Button>
        </div>
        <p className="text-xs text-neutral-500 text-center">
          {currentIndex < decisionPoints.length - 1
            ? 'Continue to next decision point'
            : 'Submit your complete analysis for AI feedback'}
        </p>
      </div>

      {/* Soft Paywall Modal */}
      <Dialog open={showPaywallModal} onOpenChange={setShowPaywallModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-gray-900">
              The Analyst&apos;s Debrief is a Classified Asset
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              You have successfully completed the first stage. Your decisions have been logged. To receive your full performance debrief—including your competency scores and a breakdown of your strategic errors—you must be an active operative.
            </DialogDescription>
          </DialogHeader>
          
          {/* Blurred Radar Chart Preview */}
          <div className="relative bg-gray-100 border border-gray-200 rounded p-8 my-4">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <div className="relative opacity-20">
              {/* Placeholder radar chart visual */}
              <div className="w-full h-48 flex items-center justify-center text-gray-400 text-sm">
                Performance Debrief Preview
              </div>
            </div>
            <div className="absolute top-2 right-2">
              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded uppercase tracking-wide">
                Classified
              </span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white rounded-none"
            >
              <Link href="/pricing">
                Authorize Plan & Reveal Debrief
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPaywallModal(false)}
              size="lg"
              className="w-full sm:w-auto border-gray-300 hover:border-gray-400 rounded-none"
            >
              Continue without analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

