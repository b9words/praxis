import PraxisRadarChart from '@/components/profile/PraxisRadarChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Recommendation } from '@/lib/recommendation-engine'
import { ArrowRight, BookOpen, CheckCircle, Clock, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import Link from 'next/link'

interface FocusedDashboardProps {
  user: any
  recommendation: Recommendation | null
  residencyData: {
    year: number
    title: string
    articlesCompleted: number
    totalArticles: number
    simulationsCompleted: number
    totalSimulations: number
  } | null
  currentStreak: number
  recentActivities: any[]
  aggregateScores?: any
  communityHighlights?: Array<{
    id: string
    title: string
    author: string
    engagement: number
  }>
}

export default function FocusedDashboard({
  user,
  recommendation,
  residencyData,
  currentStreak,
  recentActivities,
  aggregateScores,
  communityHighlights = []
}: FocusedDashboardProps) {
  const getGreeting = () => {
    // Use a stable greeting to avoid hydration mismatches
    return 'Welcome back'
  }

  const getProgressPhase = () => {
    if (!residencyData) return 'setup'
    
    const articleProgress = residencyData.articlesCompleted / residencyData.totalArticles
    const simulationProgress = residencyData.simulationsCompleted / residencyData.totalSimulations
    
    if (articleProgress < 0.3) return 'learn'
    if (simulationProgress < articleProgress * 0.5) return 'practice'
    if (recentActivities.some(a => a.type === 'simulation' && !a.debriefed)) return 'debrief'
    return 'connect'
  }

  const currentPhase = getProgressPhase()
  const progressPercentage = residencyData 
    ? Math.round((residencyData.articlesCompleted / residencyData.totalArticles) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Personalized Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          {getGreeting()}, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}
        </h1>
        {residencyData ? (
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="text-blue-600 border-blue-200 px-4 py-2">
              {residencyData.title}
            </Badge>
            <div className="text-2xl font-bold text-blue-600">
              {progressPercentage}% Complete
            </div>
          </div>
        ) : (
          <p className="text-xl text-gray-600">Ready to begin your executive journey?</p>
        )}
      </div>

      {/* Learning Phase Indicator */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-900">Your Learning Journey</h2>
            <div className="flex items-center gap-2">
              {currentStreak > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  🔥 {currentStreak} day streak
                </Badge>
              )}
            </div>
          </div>

          {/* Learning Flow Visualization */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { phase: 'learn', label: 'Learn', icon: BookOpen, description: 'Master frameworks' },
              { phase: 'practice', label: 'Practice', icon: Target, description: 'Apply in simulations' },
              { phase: 'debrief', label: 'Debrief', icon: CheckCircle, description: 'Analyze performance' },
              { phase: 'connect', label: 'Connect', icon: TrendingUp, description: 'Share insights' }
            ].map((step, index) => {
              const isActive = step.phase === currentPhase
              const isCompleted = ['learn', 'practice', 'debrief'].indexOf(currentPhase) > index
              
              return (
                <div key={step.phase} className="flex flex-col items-center text-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                    ${isActive ? 'bg-blue-600 text-white scale-110' : 
                      isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className={`font-medium text-sm ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          {residencyData && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Overall Progress</span>
                <span>{residencyData.articlesCompleted} of {residencyData.totalArticles} lessons</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Primary Action Card */}
      <Card className="border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Your Next Step
          </CardTitle>
          <CardDescription className="text-green-700">
            {currentPhase === 'setup' && 'Choose your learning path to get started'}
            {currentPhase === 'learn' && 'Continue building your knowledge foundation'}
            {currentPhase === 'practice' && 'Apply what you\'ve learned in real scenarios'}
            {currentPhase === 'debrief' && 'Reflect on your performance and identify growth areas'}
            {currentPhase === 'connect' && 'Share insights and learn from peers'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendation ? (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-2">{recommendation.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{recommendation.reason}</p>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href={recommendation.url} className="flex items-center justify-center gap-2">
                    {recommendation.type === 'curriculum' ? 'Continue Learning' : 'Start Simulation'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Begin?</h3>
              <p className="text-gray-600 mb-4">
                Choose your residency path to get personalized recommendations
              </p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/residency">Choose Your Path</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats - Simplified */}
      {residencyData && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{residencyData.articlesCompleted}</div>
            <div className="text-sm text-gray-600">Lessons Completed</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-green-600">{residencyData.simulationsCompleted}</div>
            <div className="text-sm text-gray-600">Simulations Done</div>
          </Card>
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </Card>
        </div>
      )}

      {/* Praxis Profile - Central Progress Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Trophy className="h-5 w-5" />
              Your Praxis Profile
            </CardTitle>
            <CardDescription className="text-blue-700">
              Your competency growth across all simulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {aggregateScores ? (
              <div className="space-y-4">
                <PraxisRadarChart data={aggregateScores} />
                <div className="text-center">
                  <p className="text-sm text-blue-600 font-medium">
                    Complete more simulations to see your profile evolve
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/simulations">Practice Now</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Build Your Profile</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Complete simulations to unlock your competency radar chart
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/simulations">Start First Simulation</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community Highlights - Quality Network */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Insights
            </CardTitle>
            <CardDescription>
              Learn from fellow executives in your cohort
            </CardDescription>
          </CardHeader>
          <CardContent>
            {communityHighlights.length > 0 ? (
              <div className="space-y-3">
                {communityHighlights.slice(0, 3).map((highlight) => (
                  <div key={highlight.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-sm text-gray-900 mb-1">
                      {highlight.title}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>by {highlight.author}</span>
                      <span>{highlight.engagement} insights</span>
                    </div>
                  </div>
                ))}
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/community">Join Discussion</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Connect with Peers</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share insights and learn from other executives
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/community">Explore Community</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Condensed */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'article' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {activity.type === 'article' ? (
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Target className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{activity.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
            {recentActivities.length > 3 && (
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/library/curriculum">View All Progress</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
