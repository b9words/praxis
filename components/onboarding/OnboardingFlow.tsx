'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Award, BookOpen, Brain, CheckCircle2, Lock, Target, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface OnboardingFlowProps {
  userId: string
  userProfile: {
    username: string
    full_name: string
    avatar_url?: string
  }
}

interface ResidencyOption {
  year: number
  title: string
  description: string
  domains: string[]
  unlocked: boolean
  stats: {
    articles: number
    cases: number
    estimatedHours: number
  }
}

const RESIDENCIES: ResidencyOption[] = [
  {
    year: 1,
    title: 'The Operator\'s Residency',
    description: 'Master the fundamental mechanics of how a business works',
    domains: ['Financial Acumen', 'Go-to-Market Strategy', 'Operations', 'People & Organization'],
    unlocked: true,
    stats: { articles: 16, cases: 4, estimatedHours: 24 }
  },
  {
    year: 2,
    title: 'The Strategist\'s Residency',
    description: 'Learn how a business wins in competitive markets',
    domains: ['Competitive Strategy', 'Marketing & Brand', 'Global Expansion'],
    unlocked: false,
    stats: { articles: 12, cases: 3, estimatedHours: 18 }
  },
  {
    year: 3,
    title: 'The Dealmaker\'s Residency',
    description: 'Navigate complex transactions and inorganic growth',
    domains: ['M&A Fundamentals', 'Deal Execution', 'Strategic Partnerships'],
    unlocked: false,
    stats: { articles: 11, cases: 3, estimatedHours: 16 }
  },
  {
    year: 4,
    title: 'The Financier\'s Residency',
    description: 'Master capital allocation and value creation',
    domains: ['Capital Allocation', 'Investor Relations'],
    unlocked: false,
    stats: { articles: 7, cases: 2, estimatedHours: 12 }
  },
  {
    year: 5,
    title: 'The Leader\'s Residency',
    description: 'Lead through crisis and govern with wisdom',
    domains: ['Crisis Leadership', 'Corporate Governance'],
    unlocked: false,
    stats: { articles: 6, cases: 2, estimatedHours: 10 }
  }
]

const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Learn about the Execemy method' },
  { id: 'goals', title: 'Your Goals', description: 'Tell us about your aspirations' },
  { id: 'residency', title: 'Choose Path', description: 'Select your learning journey' },
  { id: 'complete', title: 'Ready', description: 'Start your first lesson' }
]

export default function OnboardingFlow({ userId, userProfile }: OnboardingFlowProps) {
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(0)
  
  // Form state
  const [goals, setGoals] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [selectedResidency, setSelectedResidency] = useState<number | null>(null)

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedResidency) {
        throw new Error('Please select a residency path')
      }

      // Update profile
      await fetchJson(`/api/profiles/${userId}`, {
        method: 'PUT',
        body: {
          bio: goals || `Aspiring business leader focused on ${RESIDENCIES[selectedResidency - 1].title.toLowerCase()}`,
        },
      })

      // Update residency
      await fetchJson('/api/residency', {
        method: 'PUT',
        body: { currentResidency: selectedResidency },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.byId(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.user.progress() })
      toast.success('Onboarding complete. Access your dashboard.')
      
      // Cookie is already set by API route in response headers
      // Set client-side cookie as backup in case API cookie isn't received
      document.cookie = `onboarding_complete=1; path=/; max-age=30; SameSite=Lax`
      
      // Redirect with query param - API route set cookie in response, this ensures it's available
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete setup')
    },
  })

  const handleComplete = () => {
    completeOnboardingMutation.mutate()
  }

  const loading = completeOnboardingMutation.isPending

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 bg-gray-900 flex items-center justify-center">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-medium text-gray-900">Access the Proving Ground</h2>
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                The proving ground for ambitious business leaders. You are about to embark on a systematic journey 
                to build world-class business acumen through interactive learning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4 text-center">
                  <BookOpen className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <h3 className="text-base font-medium text-gray-900">Learn</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600">
                    Master business frameworks through expert-curated articles with AI-powered study assistance
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4 text-center">
                  <Brain className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <h3 className="text-base font-medium text-gray-900">Practice</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600">
                    Apply knowledge in realistic business simulations with AI stakeholders and real data
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4 text-center">
                  <Users className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <h3 className="text-base font-medium text-gray-900">Connect</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600">
                    Connect with industry professionals and expand your network
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleNext} size="lg" className="px-8 rounded-none bg-gray-900 hover:bg-gray-800 text-white">
              Proceed
            </Button>
          </div>
        )

      case 1:
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-medium text-gray-900">Tell Us About Yourself</h2>
              <p className="text-sm text-gray-600">
                Help us personalize your learning experience
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentRole">What's your current role or background?</Label>
                <Input
                  id="currentRole"
                  placeholder="e.g., Software Engineer, Product Manager, Consultant"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="rounded-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">What are your career goals? (Optional)</Label>
                <Textarea
                  id="goals"
                  placeholder="e.g., Transition to product management, start my own company, move into strategy consulting..."
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={4}
                  className="rounded-none"
                />
                <p className="text-xs text-gray-500">
                  This helps us provide more relevant recommendations and examples
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack} className="rounded-none border-gray-300 hover:border-gray-400">
                Back
              </Button>
              <Button onClick={handleNext} className="rounded-none bg-gray-900 hover:bg-gray-800 text-white">
                Continue
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-medium text-gray-900">Choose Your Learning Path</h2>
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                Each residency is a structured curriculum that builds systematically. 
                Start with Year 1 to master the fundamentals.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {RESIDENCIES.map((residency) => {
                const isSelected = selectedResidency === residency.year
                const isLocked = !residency.unlocked

                return (
                  <div
                    key={residency.year}
                    className={`relative cursor-pointer transition-colors bg-white border ${
                      isSelected
                        ? 'border-gray-900'
                        : isLocked
                        ? 'border-gray-200 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => !isLocked && setSelectedResidency(residency.year)}
                  >
                    {isSelected && (
                      <div className="absolute -top-3 -right-3">
                        <Badge className="bg-gray-900 text-white gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Selected
                        </Badge>
                      </div>
                    )}

                    {isLocked && (
                      <div className="absolute -top-3 -right-3">
                        <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-700 border-gray-300">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      </div>
                    )}

                    <div className="border-b border-gray-200 px-6 py-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`
                          h-12 w-12 flex items-center justify-center font-semibold text-xl
                          ${isLocked ? 'bg-gray-100 border border-gray-200 text-gray-400' : 'bg-gray-900 text-white'}
                        `}>
                          {residency.year}
                        </div>
                        <Award className={`h-6 w-6 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900">{residency.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{residency.description}</p>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-semibold text-gray-900">{residency.stats.articles}</div>
                          <div className="text-xs text-gray-500">Articles</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-gray-900">{residency.stats.cases}</div>
                          <div className="text-xs text-gray-500">Cases</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-gray-900">{residency.stats.estimatedHours}h</div>
                          <div className="text-xs text-gray-500">Est. Time</div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Key Domains:</p>
                        <div className="flex flex-wrap gap-2">
                          {residency.domains.map((domain) => (
                            <Badge key={domain} variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack} className="rounded-none border-gray-300 hover:border-gray-400">
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!selectedResidency}
                className="rounded-none bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400"
              >
                Continue
              </Button>
            </div>
          </div>
        )

      case 3:
        const selectedPath = RESIDENCIES.find(r => r.year === selectedResidency)
        return (
          <div className="text-center space-y-8 max-w-2xl mx-auto">
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 bg-gray-900 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-medium text-gray-900">Setup Complete</h2>
              <p className="text-sm text-gray-600">
                Access to {selectedPath?.title} is active. Begin your analytical journey 
                in business decision-making.
              </p>
            </div>

            {selectedPath && (
              <div className="bg-white border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-base font-medium text-gray-900 flex items-center gap-2 justify-center">
                    <Target className="h-4 w-4 text-gray-600" />
                    Your First Steps
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-left space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">1</div>
                      <div>
                        <p className="font-medium text-gray-900">Read your first article</p>
                        <p className="text-sm text-gray-600">Start with foundational business frameworks</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">2</div>
                      <div>
                        <p className="font-medium text-gray-900">Practice in a simulation</p>
                        <p className="text-sm text-gray-600">Apply your knowledge to real business scenarios</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">3</div>
                      <div>
                        <p className="font-medium text-gray-900">Get AI-powered feedback</p>
                        <p className="text-sm text-gray-600">Receive detailed performance analysis and recommendations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack} className="rounded-none border-gray-300 hover:border-gray-400">
                Back
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                size="lg"
                className="px-8 rounded-none bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400"
              >
                {loading ? 'Setting up...' : 'Start Learning'}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">Execemy</span>
              <Badge variant="secondary">Setup</Badge>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className={`text-xs ${index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {step.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {renderStep()}
      </div>
    </div>
  )
}
