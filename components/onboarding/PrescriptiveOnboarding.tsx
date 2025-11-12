'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import PaddleCheckout from '@/components/pricing/PaddleCheckout'
import MockCheckout from '@/components/pricing/MockCheckout'
import { Badge } from '@/components/ui/badge'
import { fetchJson } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { getDomainById } from '@/lib/curriculum-data'
import { ArrowRight, Check } from 'lucide-react'
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
      'Priority AI coaching with detailed feedback',
      'Advanced simulations with AI role-play',
      'Verified Execemy credential',
      'Career coaching sessions (2/month)',
      'Exclusive networking events'
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
      '1-on-1 executive coaching (4/month)',
      'Custom learning paths',
      'Leadership assessment',
      'Alumni network access',
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

export default function PrescriptiveOnboarding({ user }: PrescriptiveOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [strategicObjective, setStrategicObjective] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [weeklyTimeCommitment, setWeeklyTimeCommitment] = useState<number>(5)
  const [preferredLearningTimes, setPreferredLearningTimes] = useState<string[]>([])
  const [selectedCompetency, setSelectedCompetency] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  const TIME_OPTIONS = [
    { value: 'morning', label: 'Morning (6am-12pm)' },
    { value: 'afternoon', label: 'Afternoon (12pm-6pm)' },
    { value: 'evening', label: 'Evening (6pm-10pm)' },
    { value: 'weekend', label: 'Weekend' },
  ]

  // Check if payment was successful (from query param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success' && currentStep === 5) {
      setCurrentStep(6)
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding')
    }
  }, [currentStep])

  const saveOnboardingDataMutation = useMutation({
    mutationFn: async (data: { 
      strategicObjective: string
      competencyId: string
      currentRole?: string
      weeklyTimeCommitment?: number
      preferredLearningTimes?: string[]
    }) => {
      setIsSaving(true)
      try {
        await fetchJson('/api/onboarding', {
          method: 'POST',
          body: {
            strategicObjective: data.strategicObjective,
            competencyId: data.competencyId,
            currentRole: data.currentRole,
            weeklyTimeCommitment: data.weeklyTimeCommitment,
            preferredLearningTimes: data.preferredLearningTimes,
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

  const handleStep1Submit = () => {
    if (!strategicObjective.trim()) {
      toast.error('Please describe your strategic objective')
      return
    }
    analytics.track('onboarding_step_completed', { step: 1, userId: user?.id })
    setCurrentStep(2)
  }

  const handleStep2Submit = () => {
    if (!currentRole.trim()) {
      toast.error('Please enter your current role')
      return
    }
    analytics.track('onboarding_step_completed', { step: 2, userId: user?.id })
    setCurrentStep(3)
  }

  const handleStep3Submit = () => {
    if (preferredLearningTimes.length === 0) {
      toast.error('Please select at least one preferred learning time')
      return
    }
    analytics.track('onboarding_step_completed', { step: 3, userId: user?.id })
    setCurrentStep(4)
  }

  const handleStep4Submit = () => {
    if (!selectedCompetency) {
      toast.error('Please select a competency')
      return
    }
    analytics.track('onboarding_step_completed', { step: 4, userId: user?.id })
    // Save onboarding data
    saveOnboardingDataMutation.mutate({
      strategicObjective,
      competencyId: selectedCompetency,
      currentRole,
      weeklyTimeCommitment,
      preferredLearningTimes,
    })
    setCurrentStep(5)
  }

  const handlePaymentSuccess = () => {
    // Payment handled via Paddle - will redirect with ?checkout=success
    // The useEffect will handle moving to step 4
  }

  const selectedCompetencyData = selectedCompetency ? COMPETENCY_MAP[selectedCompetency] : null
  const foundationalLesson = selectedCompetency ? getFoundationalLesson(selectedCompetency) : null

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Step 1: The Situation Briefing */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="border-b border-gray-300 pb-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-mono">SUBJECT: Initial Assessment</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-mono">STATUS: Pending Operative Input</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            </div>

            <div className="space-y-6 text-gray-900">
              <p className="text-base leading-relaxed">
                We begin by defining the strategic challenge. Every leader's journey starts with a clear-eyed assessment of their current position and their desired end-state.
              </p>
              <p className="text-base leading-relaxed">
                Consider your career as a company. You have assets, liabilities, and a competitive landscape.
              </p>
              <div className="space-y-3">
                <p className="text-base font-medium">
                  <strong>Describe the strategic objective of your "company." What market are you trying to win in the next five years?</strong>
                </p>
                <Textarea
                  value={strategicObjective}
                  onChange={(e) => setStrategicObjective(e.target.value)}
                  placeholder="Example: To transition from a senior engineering role to leading a new product division... or... To secure a Series A for my B2B SaaS startup..."
                  className="min-h-[120px] rounded-none border-gray-400 focus:border-gray-900 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleStep1Submit}
                disabled={!strategicObjective.trim()}
                className="rounded-none bg-gray-900 hover:bg-gray-800 text-white px-6"
              >
                Log Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Role and Context */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="bg-gray-50 border border-gray-300 p-4">
              <div className="text-xs text-gray-500 font-mono mb-1">LOGGED OBJECTIVE</div>
              <div className="text-sm text-gray-900">{strategicObjective}</div>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-mono">SUBJECT: Context Assessment</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            </div>

            <div className="space-y-6 text-gray-900">
              <p className="text-base leading-relaxed">
                To tailor your learning path, we need to understand your current position and context.
              </p>
              <div className="space-y-3">
                <p className="text-base font-medium">
                  <strong>What is your current role or professional background?</strong>
                </p>
                <Textarea
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager, Consultant, Entrepreneur..."
                  className="min-h-[80px] rounded-none border-gray-400 focus:border-gray-900 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleStep2Submit}
                disabled={!currentRole.trim()}
                className="rounded-none bg-gray-900 hover:bg-gray-800 text-white px-6"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Time Preferences */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="bg-gray-50 border border-gray-300 p-4">
              <div className="text-xs text-gray-500 font-mono mb-1">LOGGED ROLE</div>
              <div className="text-sm text-gray-900">{currentRole}</div>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-mono">SUBJECT: Resource Allocation</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            </div>

            <div className="space-y-6 text-gray-900">
              <p className="text-base leading-relaxed">
                Effective learning requires consistent time investment. Let's optimize your schedule.
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-base font-medium mb-3">
                    <strong>How many hours per week can you commit to learning?</strong>
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="1"
                      value={weeklyTimeCommitment}
                      onChange={(e) => setWeeklyTimeCommitment(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-lg font-medium text-gray-900 min-w-[60px] text-right">
                      {weeklyTimeCommitment} hrs/week
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-base font-medium mb-3">
                    <strong>When do you prefer to learn? (Select all that apply)</strong>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {TIME_OPTIONS.map((option) => (
                      <Card
                        key={option.value}
                        className={`cursor-pointer border-2 transition-all rounded-none ${
                          preferredLearningTimes.includes(option.value)
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => {
                          setPreferredLearningTimes(prev =>
                            prev.includes(option.value)
                              ? prev.filter(t => t !== option.value)
                              : [...prev, option.value]
                          )
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 border-2 rounded flex-shrink-0 ${
                              preferredLearningTimes.includes(option.value)
                                ? 'border-gray-900 bg-gray-900'
                                : 'border-gray-400'
                            }`}>
                              {preferredLearningTimes.includes(option.value) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm text-gray-900">{option.label}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleStep3Submit}
                disabled={preferredLearningTimes.length === 0}
                className="rounded-none bg-gray-900 hover:bg-gray-800 text-white px-6"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: The Diagnostic */}
        {currentStep === 4 && (
          <div className="space-y-8">
            {/* Display logged objective */}
            <div className="bg-gray-50 border border-gray-300 p-4">
              <div className="text-xs text-gray-500 font-mono mb-1">LOGGED OBJECTIVE</div>
              <div className="text-sm text-gray-900">{strategicObjective}</div>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-mono">SUBJECT: Resource Allocation</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            </div>

            <div className="space-y-6 text-gray-900">
              <p className="text-base leading-relaxed">
                <strong>ANALYSIS: Acknowledged.</strong> Achieving this objective requires closing a critical competency gap. A leader's primary function is to allocate their most limited resource—time—against the highest-leverage opportunity.
              </p>
              <p className="text-base leading-relaxed">
                We will now allocate your initial training resources.
              </p>
              <p className="text-base font-medium">
                <strong>Based on your objective, which of these 10 core competencies represents your most significant current gap?</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COMPETENCIES.map((competency) => (
                <Card
                  key={competency.id}
                  className={`cursor-pointer border-2 transition-all rounded-none ${
                    selectedCompetency === competency.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedCompetency(competency.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 border-2 rounded flex-shrink-0 ${
                        selectedCompetency === competency.id
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-400'
                      }`}>
                        {selectedCompetency === competency.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 mb-1">
                          {competency.title}
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {competency.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleStep4Submit}
                disabled={!selectedCompetency || isSaving}
                className="rounded-none bg-gray-900 hover:bg-gray-800 text-white px-6"
              >
                {isSaving ? 'Saving...' : 'Confirm Allocation'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: The Commitment */}
        {currentStep === 5 && selectedCompetencyData && (
          <div className="space-y-8">
            <div className="bg-gray-50 border border-gray-300 p-4">
              <div className="text-xs text-gray-500 font-mono mb-1">ALLOCATION CONFIRMED</div>
              <div className="text-sm text-gray-900 font-medium">{selectedCompetencyData.title}</div>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-mono">SUBJECT: Finalizing Resource Commitment</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-mono">STATUS: Awaiting Authorization</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            </div>

            <div className="space-y-6 text-gray-900">
              <p className="text-base leading-relaxed">
                <strong>ANALYSIS:</strong> Your training resources are allocated. Your first deployment is calculated. One final action is required to activate the program.
              </p>
              <p className="text-base leading-relaxed">
                Success in any high-stakes endeavor requires a commitment of resources. This is the point of no return. Choose your engagement level to proceed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative border-2 rounded-none ${
                    plan.popular
                      ? 'border-gray-900'
                      : 'border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gray-900 text-white text-xs font-medium rounded-none">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <div className="text-xl font-medium text-gray-900 mb-2">{plan.name}</div>
                      <div className="text-sm text-gray-600 mb-4">{plan.description}</div>
                      <div className="mb-4">
                        <span className="text-4xl font-light text-gray-900 tracking-tight">{plan.price}</span>
                        <span className="text-sm text-gray-600">{plan.period}</span>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-gray-900 flex-shrink-0 mt-0.5" />
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
                            ? 'bg-gray-900 hover:bg-gray-800 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        Authorize {plan.name} Plan
                      </MockCheckout>
                    ) : plan.planId ? (
                      <PaddleCheckout
                        planId={plan.planId}
                        planName={plan.name}
                        onSuccess={handlePaymentSuccess}
                        className={`w-full h-12 text-sm font-medium rounded-none ${
                          plan.popular
                            ? 'bg-gray-900 hover:bg-gray-800 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        Authorize {plan.name} Plan
                      </PaddleCheckout>
                    ) : (
                      <Button
                        disabled
                        className={`w-full h-12 text-sm font-medium rounded-none ${
                          plan.popular
                            ? 'bg-gray-900 hover:bg-gray-800 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        Plan Unavailable
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center text-sm text-gray-600">
              All plans include a 30-day evaluation period. Full refund if the program does not meet your analytical standards.
            </div>
          </div>
        )}

        {/* Step 6: The First Session Plan */}
        {currentStep === 6 && selectedCompetencyData && foundationalLesson && (
          <div className="space-y-8">
            <div className="bg-gray-900 text-white p-4 text-center">
              <div className="text-sm font-medium">Authorization Complete. Welcome, Operative.</div>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-mono">SUBJECT: Initial Deployment</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
            </div>

            <div className="space-y-6 text-gray-900">
              <p className="text-base leading-relaxed">
                <strong>ACTION: Acknowledged.</strong> Your initial focus will be on <strong>{selectedCompetencyData.title}</strong>. This is a high-leverage choice.
              </p>
              <p className="text-base leading-relaxed">
                Based on your commitment of <strong>{weeklyTimeCommitment} hours per week</strong> and preferred learning times, here's your personalized first session plan:
              </p>
            </div>

            <Card className="border-2 border-gray-300 rounded-none">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="text-xs text-gray-500 font-mono mb-2">FIRST SESSION PLAN</div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">📚</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 font-mono mb-1">DOMAIN</div>
                          <div className="text-sm font-medium text-gray-900 mb-4">
                            {foundationalLesson.domainTitle}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mb-1">LESSON</div>
                          <div className="text-base font-medium text-gray-900 mb-2">
                            {foundationalLesson.lessonTitle}
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            {foundationalLesson.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-xs text-gray-500 font-mono mb-2">RECOMMENDED SCHEDULE</div>
                    <div className="space-y-2 text-sm text-gray-900">
                      <p><strong>Weekly Commitment:</strong> {weeklyTimeCommitment} hours</p>
                      <p><strong>Preferred Times:</strong> {preferredLearningTimes.map(t => TIME_OPTIONS.find(o => o.value === t)?.label).join(', ')}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        We'll send you reminders during your preferred learning times to help you stay on track.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button
                asChild
                className="rounded-none bg-gray-900 hover:bg-gray-800 text-white px-8"
              >
                <Link href={foundationalLesson.url}>
                  Begin Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {currentStep < 6 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Step {currentStep} of {totalSteps}</span>
              <div className="flex-1 mx-4 bg-gray-200 h-1">
                <div
                  className="bg-gray-900 h-1 transition-all"
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
