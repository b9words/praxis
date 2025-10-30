'use client'

import AIPersonaChat from '@/components/simulation/AIPersonaChat'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DecisionPoint, Persona, UserDecision } from '@/types/simulation.types'
import { CheckCircle2, MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface DecisionWorkspaceProps {
  decisionPoints: DecisionPoint[]
  personas: Persona[]
  currentIndex: number
  decisions: UserDecision[]
  onDecisionComplete: (decision: UserDecision) => void
  onComplete: () => void
}

export default function DecisionWorkspace({
  decisionPoints,
  personas,
  currentIndex,
  decisions,
  onDecisionComplete,
  onComplete,
}: DecisionWorkspaceProps) {
  const currentDecision = decisionPoints[currentIndex]
  const [justification, setJustification] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [showPersonaChat, setShowPersonaChat] = useState(false)
  const [chatTranscript, setChatTranscript] = useState<Array<{ role: 'user' | 'ai'; message: string; timestamp: string }>>([])

  if (!currentDecision) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>All Decisions Complete</CardTitle>
            <CardDescription>All decision points have been completed in this simulation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onComplete} className="w-full" size="lg">
              Submit & View Debrief
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const persona = currentDecision.requiresPersona 
    ? personas.find(p => p.id === currentDecision.requiresPersona)
    : null

  const handleSubmit = () => {
    if (!justification.trim()) return

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
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / decisionPoints.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Decision prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{currentDecision.title}</CardTitle>
            <CardDescription className="text-base">{currentDecision.description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Persona interaction if required */}
        {persona && !showPersonaChat && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Role-Play Required
              </CardTitle>
              <CardDescription>
                You need to interact with <strong>{persona.name}</strong> ({persona.role}) before making your final decision.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowPersonaChat(true)} variant="default" className="w-full">
                Start Conversation with {persona.name}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Persona chat interface */}
        {showPersonaChat && persona && (
          <Card>
            <CardHeader>
              <CardTitle>Conversation with {persona.name}</CardTitle>
              <CardDescription>{persona.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <AIPersonaChat
                caseData={{}}
                personaName={persona.name}
                personaRole={persona.role}
                onComplete={() => setShowPersonaChat(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Multiple choice options */}
        {currentDecision.type === 'multiple_choice' && currentDecision.options && (
          <Card>
            <CardHeader>
              <CardTitle>Select the optimal strategic path</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentDecision.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`
                    w-full text-left p-4 rounded-lg border-2 transition-all
                    ${selectedOption === option.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center
                      ${selectedOption === option.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
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
            </CardContent>
          </Card>
        )}

        {/* Justification */}
        <Card>
            <CardHeader>
              <CardTitle>Quantitative Reasoning</CardTitle>
              <CardDescription>
                Analyze the provided data. Justify your decision below with quantitative reasoning.
              </CardDescription>
            </CardHeader>
          <CardContent>
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
                className="resize-none"
              />
              <p className="text-sm text-gray-600">
                {justification.length} / 50 minimum characters
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit button */}
      <div className="border-t border-gray-200 bg-white p-4">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="w-full"
        >
          {currentIndex < decisionPoints.length - 1 ? 'Submit & Continue' : 'Submit Final Decision'}
        </Button>
      </div>
    </div>
  )
}

