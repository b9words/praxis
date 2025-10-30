'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, BookOpen, CheckCircle, Target, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PrescriptiveOnboardingProps {
  user: any
}

export default function PrescriptiveOnboarding({ user }: PrescriptiveOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedResidency, setSelectedResidency] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const handleResidencySelect = (residency: number) => {
    setSelectedResidency(residency)
    setCurrentStep(2)
  }

  const handleComplete = async () => {
    if (!selectedResidency) return
    
    setIsLoading(true)
    try {
      // Save residency selection to database
      const { error } = await supabase
        .from('user_residency')
        .upsert({
          user_id: user.id,
          current_residency: selectedResidency,
          started_at: new Date().toISOString()
        })

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setIsLoading(false)
    }
  }

  const getGreeting = () => {
    // Use a stable greeting to avoid hydration mismatches
    return 'Welcome'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            {getGreeting()}, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-xl text-gray-600">
            Welcome to your executive development journey
          </p>
          <div className="flex items-center justify-center gap-4">
            <Progress value={progress} className="w-64" />
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
          </div>
        </div>

        {/* Step 1: Residency Selection */}
        {currentStep === 1 && (
          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-900">Choose Your Learning Path</CardTitle>
              <CardDescription className="text-lg">
                We recommend starting with <strong>Year 1: The Operator's Residency</strong> - 
                the foundational program for business leaders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recommended Path */}
              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 relative">
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-green-600 text-white">Recommended</Badge>
                </div>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-green-900 mb-2">
                        Year 1: The Operator's Residency
                      </h3>
                      <p className="text-green-700 mb-4">
                        Master the fundamentals of business operations, financial acumen, and strategic thinking. 
                        Perfect for executives looking to build a strong foundation.
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm text-green-600 mb-4">
                        <div>• Financial Statement Analysis</div>
                        <div>• Unit Economics Mastery</div>
                        <div>• Strategic Decision Making</div>
                        <div>• Crisis Management</div>
                      </div>
                      <Button 
                        onClick={() => handleResidencySelect(1)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Start Year 1 Journey
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="opacity-75">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-700 mb-2">Year 2+</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Advanced programs available after completing Year 1
                      </p>
                      <Button variant="outline" disabled className="w-full">
                        Complete Year 1 First
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="opacity-75">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-700 mb-2">Custom Path</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Tailored programs for experienced executives
                      </p>
                      <Button variant="outline" disabled className="w-full">
                        Coming Soon
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Learning Approach */}
        {currentStep === 2 && (
          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-blue-900">Your Learning Journey</CardTitle>
              <CardDescription className="text-lg">
                Here's how you'll progress through <strong>Year 1: The Operator's Residency</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Learning Flow */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-900 mb-2">1. Learn</h3>
                    <p className="text-sm text-blue-700">
                      Master business frameworks through structured curriculum
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center bg-green-50">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-2">2. Practice</h3>
                    <p className="text-sm text-green-700">
                      Apply knowledge in interactive business simulations
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center bg-purple-50">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-900 mb-2">3. Debrief</h3>
                    <p className="text-sm text-purple-700">
                      Analyze performance and build your Praxis Profile
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* What You'll Build */}
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-4 text-center">
                    You'll Build Your Praxis Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                      <p className="text-indigo-700 mb-4">
                        As you complete simulations, you'll develop a comprehensive competency profile across:
                      </p>
                      <ul className="space-y-2 text-sm text-indigo-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Financial Acumen
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Strategic Thinking
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Market Awareness
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Risk Management
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Leadership Judgment
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="h-16 w-16 text-indigo-600" />
                      </div>
                      <p className="text-sm text-indigo-600">
                        Your radar chart will evolve as you progress
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button onClick={() => setCurrentStep(3)} className="px-8">
                  I'm Ready to Begin
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: First Step */}
        {currentStep === 3 && (
          <Card className="border-2 border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-900">Your First Clear Step</CardTitle>
              <CardDescription className="text-lg">
                Let's start your journey with the foundational lesson in financial acumen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-900 mb-2">
                        Lesson 1: Reading Financial Statements
                      </h3>
                      <p className="text-blue-700 mb-4">
                        Master the fundamentals of financial statement analysis - the foundation 
                        of business decision-making. This 12-minute lesson will give you the tools 
                        to understand any company's financial health.
                      </p>
                      <div className="flex items-center gap-4 text-sm text-blue-600 mb-4">
                        <span>📊 Financial Analysis</span>
                        <span>⏱️ 12 minutes</span>
                        <span>📈 Beginner</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  After this lesson, you'll practice with an interactive simulation: 
                  <strong> "The Unit Economics Crisis"</strong>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleComplete} 
                    disabled={isLoading}
                    className="px-8 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? 'Setting up your journey...' : 'Start My Journey'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <Link href="/community">
                      <Users className="mr-2 h-4 w-4" />
                      Meet Your Cohort
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
