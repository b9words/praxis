import PraxisRadarChart from '@/components/profile/PraxisRadarChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Recommendation } from '@/lib/recommendation-engine'
import { ArrowRight, BookOpen, CheckCircle2, Target, Users } from 'lucide-react'
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
  const progressPercentage = residencyData 
    ? Math.round((residencyData.articlesCompleted / residencyData.totalArticles) * 100)
    : 0

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 tracking-tight">
              Dashboard
            </h1>
            {user.user_metadata?.full_name && (
              <p className="text-sm text-gray-500 mt-1">
                {user.user_metadata.full_name}
              </p>
            )}
          </div>
          {residencyData && (
            <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300 px-3 py-1">
              {residencyData.title}
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Row */}
      {residencyData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Articles Internalized
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">
              {residencyData.articlesCompleted}
            </div>
            <div className="text-xs text-gray-500">
              of {residencyData.totalArticles} total
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Engagements Completed
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">
              {residencyData.simulationsCompleted}
            </div>
            <div className="text-xs text-gray-500">
              {residencyData.totalSimulations} available
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Progress
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">
              {progressPercentage}%
            </div>
            <div className="text-xs text-gray-500">
              residency completion
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Current Streak
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">
              {currentStreak}
            </div>
            <div className="text-xs text-gray-500">
              consecutive days
            </div>
          </div>
        </div>
      )}

      {/* Primary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Column - 8 cols */}
        <div className="lg:col-span-8 space-y-8">
          {/* Optimal Next Move */}
          {recommendation ? (
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">Optimal Next Move</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">
                    {recommendation.title}
                  </h3>
                  {recommendation.competencyName && (
                    <p className="text-sm text-gray-500 mb-3">
                      {recommendation.competencyName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {recommendation.reason}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none text-sm font-medium">
                    <Link href={recommendation.url} className="flex items-center justify-center gap-2">
                      Engage Target
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">Optimal Next Move</h2>
              </div>
              <div className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-2">Select Residency Path</h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  Choose your residency to receive personalized recommendations based on your learning progress.
                </p>
                <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none text-sm font-medium">
                  <Link href="/residency">Choose Your Path</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Praxis Profile */}
          <div className="bg-white border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Competency Matrix</h2>
                {aggregateScores && (
                  <Button asChild variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900 rounded-none">
                    <Link href="/simulations">View All Engagements</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="p-6">
              {aggregateScores ? (
                <div className="space-y-6">
                  <PraxisRadarChart data={aggregateScores} />
                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-3">
                      Complete more engagements to expand your competency analysis
                    </p>
                    <Button asChild variant="outline" size="sm" className="rounded-none border-gray-300">
                      <Link href="/simulations">Deploy to Scenario</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Target className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No Competency Data</h3>
                  <p className="text-xs text-gray-500 mb-6">
                    Complete engagements to generate your competency matrix
                  </p>
                  <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none text-sm font-medium">
                    <Link href="/simulations">Deploy to Scenario</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 4 cols */}
        <div className="lg:col-span-4 space-y-8">
          {/* Network Activity */}
          <div className="bg-white border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Network Activity</h2>
                <Button asChild variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900 rounded-none p-0 h-auto">
                  <Link href="/community">View All</Link>
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Recent activity from The Exchange</p>
            </div>
            <div className="p-6">
              {communityHighlights.length > 0 ? (
                <div className="space-y-4">
                  {communityHighlights.slice(0, 4).map((highlight) => (
                    <Link
                      key={highlight.id}
                      href={`/community/${highlight.id}`}
                      className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1 group-hover:text-gray-700">
                        {highlight.title}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{highlight.author}</span>
                        <span>{highlight.engagement} contributions</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No Recent Activity</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Connect with operatives in The Exchange
                  </p>
                  <Button asChild variant="outline" size="sm" className="rounded-none border-gray-300 text-xs">
                    <Link href="/community">Open a Thread</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Progress Overview (if residency data exists) */}
          {residencyData && (
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">Progress Overview</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Articles</span>
                    <span>{residencyData.articlesCompleted} / {residencyData.totalArticles}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Engagements</span>
                    <span>{residencyData.simulationsCompleted} / {residencyData.totalSimulations}</span>
                  </div>
                  <Progress 
                    value={Math.round((residencyData.simulationsCompleted / residencyData.totalSimulations) * 100)} 
                    className="h-1.5" 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity - Table Style */}
      {recentActivities.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <Button asChild variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900 rounded-none p-0 h-auto">
                <Link href="/library/curriculum">View All</Link>
              </Button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivities.slice(0, 5).map((activity, index) => (
              <Link
                key={index}
                href={activity.type === 'article' ? `/library/curriculum/${activity.id}` : `/simulations/${activity.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-shrink-0">
                  {activity.type === 'article' ? (
                    <BookOpen className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Target className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    {activity.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {activity.competency && `${activity.competency} • `}
                    {new Date(activity.completedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
