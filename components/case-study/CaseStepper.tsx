'use client'

import { CheckCircle2, Circle, Lock } from 'lucide-react'
import { DecisionPoint, UserDecision } from '@/types/simulation.types'

interface CaseStepperProps {
  decisionPoints: DecisionPoint[]
  currentIndex: number
  decisions: UserDecision[]
  onStepClick?: (index: number) => void
}

export default function CaseStepper({
  decisionPoints,
  currentIndex,
  decisions,
  onStepClick,
}: CaseStepperProps) {
  const getStepStatus = (index: number) => {
    if (index < currentIndex) return 'completed'
    if (index === currentIndex) return 'current'
    return 'upcoming'
  }

  return (
    <div className="h-full bg-white border-r border-neutral-200 p-4">
      <div className="mb-4">
        <h3 className="text-xs font-medium text-neutral-900 uppercase tracking-wide mb-1">Tasks</h3>
        <p className="text-xs text-neutral-600">
          {decisions.length} of {decisionPoints.length} completed
        </p>
      </div>
      <nav className="space-y-1">
        {decisionPoints.map((point, index) => {
          const status = getStepStatus(index)
          const decision = decisions.find(d => d.decisionPointId === point.id)
          const isClickable = index <= currentIndex && onStepClick

          return (
            <button
              key={point.id}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`
                w-full text-left p-3 rounded transition-colors
                ${status === 'current' 
                  ? 'bg-neutral-50 border-l-2 border-neutral-900' 
                  : status === 'completed'
                    ? 'hover:bg-neutral-50'
                    : 'opacity-60 cursor-not-allowed'
                }
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-neutral-600" />
                  ) : status === 'current' ? (
                    <Circle className="h-4 w-4 text-neutral-900 fill-current" />
                  ) : (
                    <Lock className="h-4 w-4 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-neutral-500 font-mono mb-1">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className={`text-sm font-medium ${
                    status === 'current' ? 'text-neutral-900' : 'text-neutral-600'
                  }`}>
                    {point.title}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}


