import CurriculumRoadmap from '@/components/dashboard/CurriculumRoadmap'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock, BookOpen, Target } from 'lucide-react'
import Link from 'next/link'
import type { RecommendationWithAlternates } from '@/lib/recommendation-engine'

interface FocusedDashboardProps {
  roadmap: {
    totalLessons: number
    completedCount: number
    nextLesson: {
      domainId: string
      moduleId: string
      lessonId: string
      title: string
      url: string
    } | null
    sections: Array<{
      domainId: string
      domainTitle: string
      modules: Array<{
        moduleId: string
        moduleTitle: string
        moduleNumber: number
        lessons: Array<{
          lessonId: string
          lessonTitle: string
          lessonNumber: number
          status: 'completed' | 'in_progress' | 'not_started'
          url: string
        }>
      }>
    }>
  }
  recommendation: RecommendationWithAlternates
  jumpBackInItems: Array<{ type: 'lesson' | 'simulation'; id: string; title: string; url: string; progress?: number }>
  currentStreak: number
  weeklyGoal: {
    targetHours: number
    currentHours: number
    progress: number
  }
  latestKeyInsight: string | null
  learningTrack: string | null
}

const TRACK_LABELS: Record<string, string> = {
  'prepare-management': 'Prepare for Management',
  'master-strategy': 'Master Corporate Strategy',
  'think-investor': 'Think Like an Investor',
}

export default function FocusedDashboard({
  roadmap,
  recommendation,
  jumpBackInItems,
  currentStreak,
  weeklyGoal,
  latestKeyInsight,
  learningTrack,
}: FocusedDashboardProps) {
  const resumeItem = jumpBackInItems[0]
  const nextRecommendations = [
    recommendation.primary,
    ...recommendation.alternates.slice(0, 2),
  ].filter(Boolean)
  
  const trackLabel = learningTrack ? TRACK_LABELS[learningTrack] || learningTrack : 'Your Learning'

  return (
    <div className="space-y-12">
      {/* Your Next Step - Unified */}
      {(resumeItem || nextRecommendations.length > 0) && (
        <div className="border-t border-neutral-200 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <ArrowRight className="h-4 w-4 text-neutral-600" />
            <h2 className="text-xl font-light text-neutral-900 tracking-tight">
              Your Next Step{learningTrack ? ` on the '${trackLabel}' Track` : ''}
            </h2>
          </div>
          
          {/* Primary Next Step */}
          {resumeItem && (
            <div className="bg-neutral-50 border border-neutral-200 p-6 mb-4">
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
                    {resumeItem.type === 'lesson' ? (
                      <>
                        <BookOpen className="h-3 w-3" />
                        <span>Article</span>
                      </>
                    ) : (
                      <>
                        <Target className="h-3 w-3" />
                        <span>Case Study</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-2xl font-light text-neutral-900 tracking-tight">
                    {resumeItem.title}
                  </h3>
                  {resumeItem.progress !== undefined && resumeItem.progress > 0 && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <span>{resumeItem.progress}% complete</span>
                    </div>
                  )}
                </div>
                <Button 
                  asChild 
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none px-8 h-12 text-sm font-medium"
                >
                  <Link href={resumeItem.url}>
                    {resumeItem.progress && resumeItem.progress > 0 ? 'Resume' : 'Start'}
                  </Link>
                </Button>
              </div>
            </div>
          )}
          
          {/* Upcoming Items (1-2 next items) */}
          {nextRecommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
              {nextRecommendations.slice(0, 2).map((rec, idx) => (
                rec && (
                  <Link key={rec.id} href={rec.url}>
                    <div className="bg-white border border-neutral-200 hover:border-neutral-300 transition-colors p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs text-neutral-400 font-mono">
                          Next {idx + 1}
                        </div>
                        {rec.type === 'curriculum' ? (
                          <BookOpen className="h-4 w-4 text-neutral-400" />
                        ) : (
                          <Target className="h-4 w-4 text-neutral-400" />
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-neutral-900 mb-1 leading-tight">
                        {rec.title}
                      </h3>
                      <p className="text-xs text-neutral-600 leading-snug">
                        {rec.reason}
                      </p>
                    </div>
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Goal, Momentum & Key Insights */}
      <div className="border-t border-neutral-200 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Weekly Goal */}
          <div className="bg-neutral-50 border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-neutral-900">Weekly Goal</h3>
              <Clock className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-light text-neutral-900">{weeklyGoal.currentHours}</span>
                <span className="text-sm text-neutral-600">/ {weeklyGoal.targetHours} hours</span>
              </div>
              <div className="w-full bg-neutral-200 h-2">
                <div
                  className="bg-neutral-900 h-2 transition-all"
                  style={{ width: `${Math.min(100, weeklyGoal.progress)}%` }}
                />
              </div>
              <p className="text-xs text-neutral-600">
                {weeklyGoal.progress >= 100
                  ? 'Goal achieved! Keep it up.'
                  : weeklyGoal.targetHours === 2 && !weeklyGoal.currentHours
                  ? 'Set your weekly goal in settings'
                  : `${Math.round(weeklyGoal.targetHours - weeklyGoal.currentHours)} hours remaining this week`}
              </p>
            </div>
          </div>

          {/* Momentum (formerly Streak) */}
          {currentStreak > 0 && (
            <div className="bg-neutral-50 border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-neutral-900">Momentum</h3>
                <Target className="h-4 w-4 text-neutral-400" />
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-light text-neutral-900">{currentStreak}-day momentum</div>
                <p className="text-xs text-neutral-600">
                  {currentStreak === 1
                    ? 'Great start! Come back tomorrow to keep it going.'
                    : `Keep your momentum going. Continue your learning journey today.`}
                </p>
              </div>
            </div>
          )}

          {/* Key Insights */}
          {latestKeyInsight && (
            <div className="bg-neutral-50 border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-neutral-900">Key Insights</h3>
                <Target className="h-4 w-4 text-neutral-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {latestKeyInsight}
                </p>
                <p className="text-xs text-neutral-500 italic">
                  From your latest case study debrief
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Roadmap */}
      <div className="border-t border-neutral-200 pt-12">
        <CurriculumRoadmap roadmap={roadmap} />
      </div>
    </div>
  )
}
