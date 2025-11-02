'use client'

import AIPersonaChat from '@/components/simulation/AIPersonaChat'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DecisionPoint, Persona, UserDecision } from '@/types/simulation.types'
import { CheckCircle2, MessageSquare, Lock } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface DecisionWorkspaceProps {
  decisionPoints: DecisionPoint[]
  personas: Persona[]
  currentIndex: number
  decisions: UserDecision[]
  onDecisionComplete: (decision: UserDecision) => void
  onComplete: () => void
  softPaywallEnabled?: boolean
}

export default function DecisionWorkspace({
  decisionPoints,
  personas,
  currentIndex,
  decisions,
  onDecisionComplete,
  onComplete,
  softPaywallEnabled = false,
}: DecisionWorkspaceProps) {
  const currentDecision = decisionPoints[currentIndex]
  const [justification, setJustification] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [showPersonaChat, setShowPersonaChat] = useState(false)
  const [chatTranscript, setChatTranscript] = useState<Array<{ role: 'user' | 'ai'; message: string; timestamp: string }>>([])
  const [showPaywallModal, setShowPaywallModal] = useState(false)

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

  const handleSubmit = () => {
    if (!justification.trim()) return

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

    onDecisionComplete(decision)
    setJustification('')
    setSelectedOption('')
    setChatTranscript([])
    setShowPersonaChat(false)
  }

  const canSubmit = justification.trim().length >= 50

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
            <h3 className="text-base font-medium text-gray-900">Quantitative Reasoning</h3>
            <p className="text-sm text-gray-600 mt-1">
              Analyze the provided data. Justify your decision below with quantitative reasoning.
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              <Label htmlFor="justification">
                Your Analysis (minimum 50 characters)
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Analyze the provided data. Select the optimal strategic path. Justify your decision below with quantitative reasoning."
                rows={8}
                className="resize-none rounded-none border-gray-300"
              />
              <p className="text-xs text-gray-600">
                {justification.length} / 50 minimum characters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="border-t border-gray-200 bg-white p-4">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="w-full rounded-none bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400 disabled:text-white"
        >
          {softPaywallEnabled && currentIndex === 0 && decisions.length === 0
            ? 'Submit & View Analysis'
            : currentIndex < decisionPoints.length - 1
            ? 'Submit & Continue'
            : 'Submit Final Decision'}
        </Button>
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

