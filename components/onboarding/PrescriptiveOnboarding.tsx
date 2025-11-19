'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import PaddleCheckout from '@/components/pricing/PaddleCheckout'
import MockCheckout from '@/components/pricing/MockCheckout'
import { Badge } from '@/components/ui/badge'
import { fetchJson } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { getDomainById } from '@/lib/curriculum-data'
import { ArrowRight, Check, BookOpen, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { analytics } from '@/lib/analytics'

const ENABLE_MOCK_CHECKOUT = process.env.NEXT_PUBLIC_ENABLE_MOCK_CHECKOUT === 'true'

interface PrescriptiveOnboardingProps {
  user: any
}

// Map the 10 core competencies to domain IDs
const COMPETENCY_MAP: Record<string, { domainId: string; title: string; description: string }> = {
  'capital-allocation': {
    domainId: 'capital-allocation',
    title: 'Mastery of Capital Allocation',
    description: 'The strategic process of deploying financial resources to generate the highest long-term value per share.'
  },
  'competitive-moat-architecture': {
    domainId: 'competitive-moat-architecture',
    title: 'Competitive Moat Architecture',
    description: 'Building structural advantages that protect a company from competitors and sustain high returns on invested capital.'
  },
  'global-systems-thinking': {
    domainId: 'global-systems-thinking',
    title: 'Global Systems Thinking',
    description: 'Understanding complex adaptive systems, feedback loops, and second-order effects that govern multinational corporations.'
  },
  'organizational-design-talent-density': {
    domainId: 'organizational-design-talent-density',
    title: 'Organizational Design & Talent Density',
    description: 'Designing systems that maximize decision-making velocity, fueled by the principle that high-impact individuals create exponential value.'
  },
  'high-stakes-dealmaking-integration': {
    domainId: 'high-stakes-dealmaking-integration',
    title: 'High-Stakes Dealmaking & Integration',
    description: 'Executing major transactions as strategic tools, from deal thesis through post-merger integration to create long-term value.'
  },
  'investor-market-narrative-control': {
    domainId: 'investor-market-narrative-control',
    title: 'Investor & Market Narrative Control',
    description: 'The art of educating investors, managing expectations, and building long-term credibility that underpins premium valuation.'
  },
  'geopolitical-regulatory-navigation': {
    domainId: 'geopolitical-regulatory-navigation',
    title: 'Geopolitical & Regulatory Navigation',
    description: 'Understanding global powers and regulatory landscapes as primary strategic arenas for multinational operations.'
  },
  'crisis-leadership-public-composure': {
    domainId: 'crisis-leadership-public-composure',
    title: 'Crisis Leadership & Public Composure',
    description: 'Absorbing uncertainty and radiating calm during high-consequence events that threaten company viability and reputation.'
  },
  'second-order-decision-making': {
    domainId: 'second-order-decision-making',
    title: 'Second-Order Decision Making',
    description: 'Anticipating and navigating the entire system of effects beyond immediate consequences of critical decisions.'
  },
  'technological-market-foresight': {
    domainId: 'technological-market-foresight',
    title: 'Technological & Market Foresight',
    description: 'Signal detection, synthesis, and strategic betting to position the company to win in tomorrow\'s markets.'
  }
}

const COMPETENCIES = Object.entries(COMPETENCY_MAP).map(([key, value]) => ({
  id: key,
  ...value
}))

const PLANS = [
  {
    name: 'Explorer',
    price: '$49',
    period: '/month',
    planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_EXPLORER || '',
    description: 'Perfect for individuals starting their business acumen journey',
    features: [
      'Access to Year 1: Operator\'s Residency (16 articles, 4 cases)',
      'AI Study Assistant for all articles',
      'Unlimited simulation attempts',
      'AI-powered performance debriefs',
      'Personal Execemy Profile'
    ],
    popular: false
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL || '',
    description: 'For ambitious professionals committed to mastery',
    features: [
      'Everything in Explorer, plus:',
      'Access to Years 1-3 curriculum (39 articles, 10 cases)',
      'Priority AI feedback with detailed analysis',
      'Advanced simulations with AI role-play',
      'Verified Execemy credential'
    ],
    popular: true
  },
  {
    name: 'Executive',
    price: '$199',
    period: '/month',
    planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_EXECUTIVE || '',
    description: 'Complete program for aspiring executives and leaders',
    features: [
      'Everything in Professional, plus:',
      'Full 5-year curriculum (52 articles, 14 cases)',
      'Executive-level simulations',
      'Custom learning paths',
      'Leadership assessment',
      'Lifetime credential updates'
    ],
    popular: false
  }
]

/**
 * Get the first lesson for a domain (first lesson in first module)
 */
function getFoundationalLesson(domainId: string) {
  const domain = getDomainById(domainId)
  if (!domain || domain.modules.length === 0) return null

  const firstModule = domain.modules[0]
  if (!firstModule || firstModule.lessons.length === 0) return null

  const firstLesson = firstModule.lessons[0]
  return {
    domain: domainId,
    domainTitle: domain.title,
    module: firstModule.id,
    moduleTitle: firstModule.title,
    lesson: firstLesson.id,
    lessonTitle: firstLesson.title,
    description: firstLesson.description,
    url: `/library/curriculum/${domainId}/${firstModule.id}/${firstLesson.id}`,
  }
}

const LEARNING_TRACKS = [
  { id: 'prepare-management', label: 'Prepare for Management', description: 'Build foundational leadership skills' },
  { id: 'master-strategy', label: 'Master Corporate Strategy', description: 'Develop strategic thinking capabilities' },
  { id: 'think-investor', label: 'Think Like an Investor', description: 'Learn capital allocation and value creation' },
]

const STRATEGIC_OBJECTIVES = [
  { id: 'transition-to-leadership', label: 'Transition to Leadership', description: 'Move from individual contributor to leading teams and driving outcomes' },
  { id: 'advance-to-executive', label: 'Advance to Executive Role', description: 'Prepare for C-suite or VP-level positions with strategic decision-making' },
  { id: 'start-or-scale-business', label: 'Start or Scale a Business', description: 'Build entrepreneurial skills for founding or growing a company' },
  { id: 'master-strategic-thinking', label: 'Master Strategic Thinking', description: 'Develop the ability to see the big picture and make high-impact decisions' },
  { id: 'improve-business-acumen', label: 'Improve Business Acumen', description: 'Understand how businesses operate, make money, and create value' },
  { id: 'career-pivot', label: 'Career Pivot', description: 'Transition to a new industry or role requiring different skills' },
]

export default function PrescriptiveOnboarding({ user }: PrescriptiveOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [strategicObjective, setStrategicObjective] = useState<string | null>(null)
  const [weeklyTimeCommitment, setWeeklyTimeCommitment] = useState<number>(5)
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  // Check if payment was successful (from query param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success' && currentStep === 4) {
      setCurrentStep(5)
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding')
    }
  }, [currentStep])

  const saveOnboardingDataMutation = useMutation({
    mutationFn: async (data: { 
      strategicObjective: string | null
      competencyId: string
      weeklyTimeCommitment?: number
      selectedTrack?: string
    }) => {
      setIsSaving(true)
      try {
        const objectiveLabel = data.strategicObjective 
          ? STRATEGIC_OBJECTIVES.find(o => o.id === data.strategicObjective)?.label || data.strategicObjective
          : ''
        await fetchJson('/api/onboarding', {
          method: 'POST',
          body: {
            strategicObjective: objectiveLabel,
            competencyId: data.competencyId,
            weeklyTimeCommitment: data.weeklyTimeCommitment,
            selectedTrack: data.selectedTrack,
          },
        })
      } finally {
        setIsSaving(false)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save onboarding data')
    },
  })

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStep1Submit = () => {
    if (!strategicObjective) {
      toast.error('Please select your strategic objective')
      return
    }
    analytics.track('onboarding_step_completed', { 
      stepNumber: 1, 
      stepName: 'Strategic Objective',
      userId: user?.id 
    })
    setCurrentStep(2)
  }

  const handleStep2Submit = () => {
    if (weeklyTimeCommitment < 1 || weeklyTimeCommitment > 10) {
      toast.error('Please select a weekly commitment between 1 and 10 hours')
      return
    }
    analytics.track('onboarding_step_completed', { 
      stepNumber: 2, 
      stepName: 'Weekly Commitment',
      selectedGoalHours: weeklyTimeCommitment,
      userId: user?.id 
    })
    setCurrentStep(3)
  }

  const handleStep3Submit = () => {
    if (!selectedTrack) {
      toast.error('Please select a learning track')
      return
    }
    analytics.track('onboarding_step_completed', { 
      stepNumber: 3, 
      stepName: 'Learning Track Selection',
      selectedTrack: selectedTrack,
      userId: user?.id 
    })
    setCurrentStep(4)
  }

  const handleStep4Submit = () => {
    if (!selectedCompetency) {
      toast.error('Please select a competency')
      return
    }
    analytics.track('onboarding_step_completed', { 
      stepNumber: 4, 
      stepName: 'Competency Selection',
      selectedGoalHours: weeklyTimeCommitment,
      selectedTrack: selectedTrack || undefined,
      userId: user?.id 
    })
    // Save onboarding data
    saveOnboardingDataMutation.mutate({
      strategicObjective,
      competencyId: selectedCompetency,
      weeklyTimeCommitment,
      selectedTrack: selectedTrack || undefined,
    })
    setCurrentStep(5)
  }

  const handlePaymentSuccess = () => {
    // Payment handled via Paddle - will redirect with ?checkout=success
    // The useEffect will handle moving to step 5
  }

  const selectedCompetencyData = selectedCompetency ? COMPETENCY_MAP[selectedCompetency] : null
  const foundationalLesson = selectedCompetency ? getFoundationalLesson(selectedCompetency) : null

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 flex-1 flex flex-col">
        {/* Step 1: Strategic Objective */}
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
                Define Your Strategic Objective
              </h1>
              <p className="text-base text-neutral-700 leading-relaxed">
                What market are you trying to win in the next five years? We'll personalize your learning path based on your goals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STRATEGIC_OBJECTIVES.map((objective) => (
                <Card
                  key={objective.id}
                  className={`cursor-pointer border transition-colors rounded-none ${
                    strategicObjective === objective.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setStrategicObjective(objective.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 border-2 rounded flex-shrink-0 transition-colors ${
                        strategicObjective === objective.id
                          ? 'border-neutral-900 bg-neutral-900'
                          : 'border-neutral-400'
                      }`}>
                        {strategicObjective === objective.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-neutral-900 mb-1">
                          {objective.label}
                        </div>
                        <div className="text-xs text-neutral-600 leading-relaxed">
                          {objective.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-neutral-200">
              <div className="flex justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled
                  className="rounded-none border-neutral-200 text-neutral-400 px-8 h-12 text-sm font-medium cursor-not-allowed opacity-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleStep1Submit}
                  disabled={!strategicObjective}
                  className="rounded-none bg-neutral-900 hover:bg-neutral-800 text-white px-8 h-12 text-sm font-medium"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Weekly Commitment */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col space-y-8">
            {strategicObjective && (
              <div className="bg-neutral-50 border border-neutral-200 p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Your Objective</div>
                <div className="text-sm text-neutral-900">
                  {STRATEGIC_OBJECTIVES.find(o => o.id === strategicObjective)?.label || strategicObjective}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
                Set Your Weekly Commitment
              </h1>
              <label className="text-sm font-medium text-neutral-900">
                How many hours per week can you commit?
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={weeklyTimeCommitment}
                  onChange={(e) => setWeeklyTimeCommitment(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                />
                <span className="text-lg font-light text-neutral-900 min-w-[80px] text-right">
                  {weeklyTimeCommitment} {weeklyTimeCommitment === 1 ? 'hour' : 'hours'}/week
                </span>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-neutral-200">
              <div className="flex justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="rounded-none border-neutral-200 hover:border-neutral-300 text-neutral-700 px-8 h-12 text-sm font-medium"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleStep2Submit}
                  disabled={weeklyTimeCommitment < 1 || weeklyTimeCommitment > 10}
                  className="rounded-none bg-neutral-900 hover:bg-neutral-800 text-white px-8 h-12 text-sm font-medium"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Learning Track Selection */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col space-y-8">
            {weeklyTimeCommitment > 0 && (
              <div className="bg-neutral-50 border border-neutral-200 p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Weekly Commitment</div>
                <div className="text-sm text-neutral-900">{weeklyTimeCommitment} hours/week</div>
              </div>
            )}

            <div className="space-y-4">
              <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
                Choose Your Learning Track
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LEARNING_TRACKS.map((track) => (
                <Card
                  key={track.id}
                  className={`cursor-pointer border transition-colors rounded-none ${
                    selectedTrack === track.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setSelectedTrack(track.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 border-2 rounded flex-shrink-0 transition-colors ${
                        selectedTrack === track.id
                          ? 'border-neutral-900 bg-neutral-900'
                          : 'border-neutral-400'
                      }`}>
                        {selectedTrack === track.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-neutral-900 mb-1">
                          {track.label}
                        </div>
                        <div className="text-xs text-neutral-600 leading-relaxed">
                          {track.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-neutral-200">
              <div className="flex justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="rounded-none border-neutral-200 hover:border-neutral-300 text-neutral-700 px-8 h-12 text-sm font-medium"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleStep3Submit}
                  disabled={!selectedTrack}
                  className="rounded-none bg-neutral-900 hover:bg-neutral-800 text-white px-8 h-12 text-sm font-medium"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Competency Selection */}
        {currentStep === 4 && (
          <div className="flex-1 flex flex-col space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
                Identify Your Focus Area
              </h1>
              <p className="text-base text-neutral-700 leading-relaxed">
                Which of these 10 core competencies represents your most significant current gap?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COMPETENCIES.map((competency) => (
                <Card
                  key={competency.id}
                  className={`cursor-pointer border transition-colors rounded-none ${
                    selectedCompetency === competency.id
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setSelectedCompetency(competency.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 border-2 rounded flex-shrink-0 transition-colors ${
                        selectedCompetency === competency.id
                          ? 'border-neutral-900 bg-neutral-900'
                          : 'border-neutral-400'
                      }`}>
                        {selectedCompetency === competency.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-neutral-900 mb-1">
                          {competency.title}
                        </div>
                        <div className="text-xs text-neutral-600 leading-relaxed">
                          {competency.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-neutral-200">
              <div className="flex justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="rounded-none border-neutral-200 hover:border-neutral-300 text-neutral-700 px-8 h-12 text-sm font-medium"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleStep4Submit}
                  disabled={!selectedCompetency || isSaving}
                  className="rounded-none bg-neutral-900 hover:bg-neutral-800 text-white px-8 h-12 text-sm font-medium"
                >
                  {isSaving ? 'Saving...' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Payment & First Session */}
        {currentStep === 5 && selectedCompetencyData && (
          <div className="flex-1 flex flex-col space-y-8">
            {selectedCompetencyData && (
              <div className="bg-neutral-50 border border-neutral-200 p-4">
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Focus Area</div>
                <div className="text-sm text-neutral-900 font-medium">{selectedCompetencyData.title}</div>
              </div>
            )}

            <div className="space-y-4">
              <h1 className="text-3xl font-light text-neutral-900 tracking-tight">
                Choose Your Plan
              </h1>
              <p className="text-base text-neutral-700 leading-relaxed">
                Select a plan to start your journey. You'll have immediate access to all content in your plan.
              </p>
            </div>

            {foundationalLesson && (
              <div className="bg-neutral-50 border border-neutral-200 p-4 mb-6">
                <div className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Your First Lesson</div>
                <div className="text-sm font-medium text-neutral-900 mb-1">{foundationalLesson.lessonTitle}</div>
                <div className="text-xs text-neutral-600">{foundationalLesson.domainTitle}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative border transition-colors rounded-none ${
                    plan.popular
                      ? 'border-neutral-900'
                      : 'border-neutral-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-neutral-900 text-white text-xs font-medium rounded-none">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <div className="text-xl font-light text-neutral-900 mb-2 tracking-tight">{plan.name}</div>
                      <div className="text-sm text-neutral-600 mb-4">{plan.description}</div>
                      <div className="mb-4">
                        <span className="text-4xl font-light text-neutral-900 tracking-tight">{plan.price}</span>
                        <span className="text-sm text-neutral-600">{plan.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                          <Check className="w-4 h-4 text-neutral-900 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {ENABLE_MOCK_CHECKOUT ? (
                      <MockCheckout
                        planName={plan.name}
                        onSuccess={handlePaymentSuccess}
                        className={`w-full h-12 text-sm font-medium rounded-none ${
                          plan.popular
                            ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                        }`}
                      >
                        Select {plan.name} Plan
                      </MockCheckout>
                    ) : plan.planId ? (
                      <PaddleCheckout
                        planId={plan.planId}
                        planName={plan.name}
                        onSuccess={handlePaymentSuccess}
                        className={`w-full h-12 text-sm font-medium rounded-none ${
                          plan.popular
                            ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                        }`}
                      >
                        Select {plan.name} Plan
                      </PaddleCheckout>
                    ) : (
                      <Button
                        disabled
                        className={`w-full h-12 text-sm font-medium rounded-none ${
                          plan.popular
                            ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                        }`}
                      >
                        Plan Unavailable
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center text-sm text-neutral-600">
              We offer a 30-day evaluation and refund period from the date of your initial subscription. If you are not satisfied with the Service during this period, you may request a full refund by contacting us at support@execemy.com.
            </div>

            {foundationalLesson && (
              <div className="mt-8 pt-8 border-t border-neutral-200">
                <div className="flex justify-center">
                  <Button
                    asChild
                    className="rounded-none bg-neutral-900 hover:bg-neutral-800 text-white px-8 h-12 text-sm font-medium"
                  >
                    <Link href={foundationalLesson.url}>
                      Begin Your First Lesson
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {currentStep < 5 && (
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Step {currentStep} of {totalSteps}</span>
              <div className="flex-1 mx-4 bg-neutral-200 h-1">
                <div
                  className="bg-neutral-900 h-1 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
