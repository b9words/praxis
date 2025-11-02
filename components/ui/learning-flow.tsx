import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, MessageCircle, Target } from 'lucide-react'
import Link from 'next/link'

interface LearningFlowProps {
  currentStep: 'learn' | 'practice' | 'debrief' | 'connect'
  nextAction?: {
    label: string
    href: string
  }
  className?: string
}

const FLOW_STEPS = [
  {
    id: 'learn',
    label: 'Learn',
    icon: BookOpen,
    description: 'Read articles & frameworks',
    color: 'blue'
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: Target,
    description: 'Apply in simulations',
    color: 'green'
  },
  {
    id: 'debrief',
    label: 'Debrief',
    icon: BarChart3,
    description: 'Review performance',
    color: 'purple'
  },
  {
    id: 'connect',
    label: 'Connect',
    icon: MessageCircle,
    description: 'Discuss with community',
    color: 'orange'
  }
]

export default function LearningFlow({ currentStep, nextAction, className = '' }: LearningFlowProps) {
  const currentIndex = FLOW_STEPS.findIndex(step => step.id === currentStep)

  return (
    <Card className={`border-l-4 border-blue-500 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">The Execemy Method</h3>
          <Badge variant="outline" className="text-xs">
            Step {currentIndex + 1} of 4
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-4">
          {FLOW_STEPS.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentIndex
            const isNext = index === currentIndex + 1
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted 
                    ? 'bg-green-600 text-white'
                    : isNext
                    ? 'bg-gray-200 text-gray-600 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {step.description}
                  </p>
                </div>
                {index < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-300 absolute translate-x-8 -translate-y-6" />
                )}
              </div>
            )
          })}
        </div>

        {nextAction && nextAction.href && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Next Step</p>
                <p className="text-xs text-gray-600">Continue your learning journey</p>
              </div>
              <Button asChild size="sm">
                <Link href={nextAction.href}>
                  {nextAction.label}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface LearningFlowBannerProps {
  currentStep: 'learn' | 'practice' | 'debrief' | 'connect'
  context: string
  nextAction?: {
    label: string
    href: string
  }
}

export function LearningFlowBanner({ currentStep, context, nextAction }: LearningFlowBannerProps) {
  const step = FLOW_STEPS.find(s => s.id === currentStep)
  if (!step) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <step.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">
              {step.label}: {context}
            </h3>
            <p className="text-sm text-blue-700">{step.description}</p>
          </div>
        </div>
        {nextAction && nextAction.href && (
          <Button asChild variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            <Link href={nextAction.href}>
              {nextAction.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
