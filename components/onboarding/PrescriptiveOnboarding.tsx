'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, BookOpen, CheckCircle2, Target, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

interface PrescriptiveOnboardingProps {
  user: any
}

export default function PrescriptiveOnboarding({ user }: PrescriptiveOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedResidency, setSelectedResidency] = useState<number | null>(null)
  const queryClient = useQueryClient()
  
  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const updateResidencyMutation = useMutation({
    mutationFn: async (year: number) => {
      const response = await fetchJson<{ residency: { currentResidency: number } }>('/api/residency', {
        method: 'PUT',
        body: { currentResidency: year },
      })
      // Verify the residency was actually saved
      if (!response?.residency || response.residency.currentResidency !== year) {
        throw new Error('Failed to verify residency was saved')
      }
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.progress() })
      
      // Cookie is already set by API route in response headers
      // Set client-side cookie as backup in case API cookie isn't received
      document.cookie = `onboarding_complete=1; path=/; max-age=30; SameSite=Lax`
      
      // Redirect with query param - API route set cookie in response, this ensures it's available
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete onboarding')
    },
  })

  const handleResidencySelect = (residency: number) => {
    setSelectedResidency(residency)
    setCurrentStep(2)
  }

  const handleComplete = () => {
    if (!selectedResidency) return
    updateResidencyMutation.mutate(selectedResidency)
  }

  const isLoading = updateResidencyMutation.isPending

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          Welcome, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-gray-600 mb-4">Access the proving ground</p>
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1 max-w-xs" />
          <span className="text-xs text-gray-500">Step {currentStep} of {totalSteps}</span>
        </div>
      </div>

      {/* Step 1: Residency Selection */}
      {currentStep === 1 && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Choose Your Learning Path</h2>
            <p className="text-xs text-gray-500 mt-1">We recommend starting with Year 1: The Operator's Residency</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Recommended Path */}
            <div className="border border-gray-300 bg-gray-50 relative">
              <div className="absolute -top-3 left-4">
                <Badge className="bg-gray-900 text-white text-xs font-medium">Recommended</Badge>
              </div>
              <div className="p-6 pt-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <Target className="h-6 w-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      Year 1: The Operator's Residency
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Master the fundamentals of business operations, financial acumen, and strategic thinking.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                      <div>Financial Statement Analysis</div>
                      <div>Unit Economics Mastery</div>
                      <div>Strategic Decision Making</div>
                      <div>Crisis Management</div>
                    </div>
                    <Button 
                      onClick={() => handleResidencySelect(1)}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none"
                    >
                      Start Year 1 Journey
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Paths */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-6 opacity-60">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Year 2+</h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Advanced programs available after completing Year 1
                  </p>
                  <Button variant="outline" disabled className="w-full border-gray-300 rounded-none">
                    Complete Year 1 First
                  </Button>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 p-6 opacity-60">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Custom Path</h3>
                  <p className="text-xs text-gray-600 mb-4">
                    Tailored programs for experienced executives
                  </p>
                  <Button variant="outline" disabled className="w-full border-gray-300 rounded-none">
                    Unavailable
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Learning Approach */}
      {currentStep === 2 && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Your Learning Journey</h2>
            <p className="text-xs text-gray-500 mt-1">Here's how you'll progress through Year 1: The Operator's Residency</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Learning Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 border border-gray-200 p-6 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">1. Learn</h3>
                <p className="text-xs text-gray-600">
                  Master business frameworks through structured curriculum
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-6 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">2. Practice</h3>
                <p className="text-xs text-gray-600">
                  Apply knowledge in interactive business simulations
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-6 text-center">
                <div className="w-16 h-16 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-gray-700" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">3. Debrief</h3>
                <p className="text-xs text-gray-600">
                  Analyze performance and build your Execemy Profile
                </p>
              </div>
            </div>

            {/* What You'll Build */}
            <div className="bg-gray-50 border border-gray-200 p-6">
              <h3 className="text-base font-medium text-gray-900 mb-4 text-center">
                You'll Build Your Execemy Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    As you complete simulations, you'll develop a comprehensive competency profile across:
                  </p>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Financial Acumen
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Strategic Thinking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Market Awareness
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Risk Management
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" />
                      Leadership Judgment
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="w-32 h-32 bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-16 w-16 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Your radar chart will evolve as you progress
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => setCurrentStep(3)} className="px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-none">
                I'm Ready to Begin
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: First Step */}
      {currentStep === 3 && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Your First Clear Step</h2>
            <p className="text-xs text-gray-500 mt-1">Let's start your journey with the foundational lesson in financial acumen</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="border border-gray-200 bg-gray-50 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white border border-gray-200 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    Lesson 1: Reading Financial Statements
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Master the fundamentals of financial statement analysis - the foundation of business decision-making.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>Financial Analysis</span>
                    <span>•</span>
                    <span>12 minutes</span>
                    <span>•</span>
                    <span>Beginner</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                After this lesson, you'll practice with an interactive simulation: <strong>"The Unit Economics Crisis"</strong>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleComplete} 
                  disabled={isLoading}
                  className="px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-none"
                >
                  {isLoading ? 'Setting up your journey...' : 'Start My Journey'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button variant="outline" asChild className="border-gray-300 hover:border-gray-400 rounded-none">
                  <Link href="/dashboard">
                    <Users className="mr-2 h-4 w-4" />
                    Meet Your Cohort
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
