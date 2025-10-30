'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Award, BookOpen, Brain, CheckCircle2, Lock, Target, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
  { id: 'welcome', title: 'Welcome', description: 'Learn about the Praxis method' },
  { id: 'goals', title: 'Your Goals', description: 'Tell us about your aspirations' },
  { id: 'residency', title: 'Choose Path', description: 'Select your learning journey' },
  { id: 'complete', title: 'Ready!', description: 'Start your first lesson' }
]

export default function OnboardingFlow({ userId, userProfile }: OnboardingFlowProps) {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
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

  const handleComplete = async () => {
    if (!selectedResidency) {
      toast.error('Please select a residency path')
      return
    }

    setLoading(true)

    try {
      // Update profile with goals and role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          bio: goals || `Aspiring business leader focused on ${RESIDENCIES[selectedResidency - 1].title.toLowerCase()}`,
          // Store additional onboarding data in a JSON field if needed
        })
        .eq('id', userId)

      if (profileError) throw profileError

      // Set user residency
      const { error: residencyError } = await supabase
        .from('user_residency')
        .upsert({
          user_id: userId,
          current_residency: selectedResidency,
          updated_at: new Date().toISOString(),
        })

      if (residencyError) throw residencyError

      toast.success('Welcome to Praxis! Let\'s start your journey.')
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      toast.error('Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Welcome to Praxis</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The proving ground for ambitious business leaders. You're about to embark on a systematic journey 
                to build world-class business acumen through interactive learning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="text-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Master business frameworks through expert-curated articles with AI-powered study assistance
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="text-center">
                  <Brain className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Practice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Apply knowledge in realistic business simulations with AI stakeholders and real data
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                <CardHeader className="text-center">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">Connect</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Learn from a vetted community of high-performing professionals and build your network
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button onClick={handleNext} size="lg" className="px-8">
              Get Started
            </Button>
          </div>
        )

      case 1:
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Tell Us About Yourself</h2>
              <p className="text-gray-600">
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
                />
                <p className="text-xs text-gray-500">
                  This helps us provide more relevant recommendations and examples
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Choose Your Learning Path</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Each residency is a structured curriculum that builds systematically. 
                Start with Year 1 to master the fundamentals.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {RESIDENCIES.map((residency) => {
                const isSelected = selectedResidency === residency.year
                const isLocked = !residency.unlocked

                return (
                  <Card
                    key={residency.year}
                    className={`relative cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-blue-500 shadow-lg'
                        : isLocked
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:shadow-md hover:-translate-y-1'
                    }`}
                    onClick={() => !isLocked && setSelectedResidency(residency.year)}
                  >
                    {isSelected && (
                      <div className="absolute -top-3 -right-3">
                        <Badge className="bg-blue-600 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Selected
                        </Badge>
                      </div>
                    )}

                    {isLocked && (
                      <div className="absolute -top-3 -right-3">
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`
                          h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl
                          ${isLocked ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}
                        `}>
                          {residency.year}
                        </div>
                        <Award className={`h-6 w-6 ${isLocked ? 'text-gray-400' : 'text-yellow-500'}`} />
                      </div>
                      <CardTitle className="text-xl">{residency.title}</CardTitle>
                      <CardDescription>{residency.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{residency.stats.articles}</div>
                          <div className="text-xs text-gray-500">Articles</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{residency.stats.cases}</div>
                          <div className="text-xs text-gray-500">Cases</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{residency.stats.estimatedHours}h</div>
                          <div className="text-xs text-gray-500">Est. Time</div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Key Domains:</p>
                        <div className="flex flex-wrap gap-2">
                          {residency.domains.map((domain) => (
                            <Badge key={domain} variant="secondary" className="text-xs">
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!selectedResidency}
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
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">You're All Set!</h2>
              <p className="text-lg text-gray-600">
                Welcome to {selectedPath?.title}. You're about to begin a transformative journey 
                in business decision-making.
              </p>
            </div>

            {selectedPath && (
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-center">
                    <Target className="h-5 w-5" />
                    Your First Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-left space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <p className="font-medium">Read your first article</p>
                        <p className="text-sm text-gray-600">Start with foundational business frameworks</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <p className="font-medium">Practice in a simulation</p>
                        <p className="text-sm text-gray-600">Apply your knowledge to real business scenarios</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <p className="font-medium">Get AI-powered feedback</p>
                        <p className="text-sm text-gray-600">Receive detailed performance analysis and recommendations</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                size="lg"
                className="px-8"
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
              <span className="text-2xl font-bold text-gray-900">Praxis</span>
              <Badge variant="secondary">Setup</Badge>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className={`text-xs ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
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
