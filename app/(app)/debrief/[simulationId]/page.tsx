'use client'

import RecommendedReading from '@/components/debrief/RecommendedReading'
import ScoreReveal from '@/components/debrief/ScoreReveal'
import ShareButtons from '@/components/debrief/ShareButtons'
import { Button } from '@/components/ui/button'
import ErrorState from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { getAllLessonsFlat, getDomainById } from '@/lib/curriculum-data'
import { getDomainIdForCompetency } from '@/lib/competency-mapping'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { Share2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function DebriefPage({ params }: { params: Promise<{ simulationId: string }> }) {
  const [simulationId, setSimulationId] = useState<string>('')
  const [showScores, setShowScores] = useState(false)

  // Resolve params
  useEffect(() => {
    async function resolveParams() {
      const resolved = await params
      setSimulationId(resolved.simulationId)
    }
    resolveParams()
  }, [params])

  // Fetch debrief
  const { data: debriefData, isLoading: debriefLoading, error: debriefError } = useQuery({
    queryKey: queryKeys.debriefs.bySimulation(simulationId),
    queryFn: ({ signal }) => fetchJson<{ debrief: any }>(`/api/debriefs/${simulationId}`, { signal }),
    enabled: !!simulationId,
    retry: 2,
  })

  // Fetch articles
  const { data: articlesData, error: articlesError } = useQuery({
    queryKey: queryKeys.articles.published(),
    queryFn: ({ signal }) => fetchJson<{ articles: any[] }>('/api/articles?status=published', { signal }),
    enabled: !!simulationId && !!debriefData,
    retry: 2,
  })

  // Fetch current user profile for share URL
  const { data: profileData } = useQuery({
    queryKey: ['profile', 'current'],
    queryFn: ({ signal }) => fetchJson<{ profile: { username: string | null } }>('/api/auth/profile', { signal }),
    enabled: !!simulationId,
    retry: 1,
  })

  // Process data
  const debrief = debriefData?.debrief
  const simulation = debrief?.simulation
  const scores = (debrief?.scores as any[]) || []
  const rubric = simulation?.case?.rubric as any
  
  // Helper to match competency name to rubric criteria
  const getRubricCriteriaForCompetency = (competencyName: string) => {
    if (!rubric?.criteria) return undefined
    
    // Try exact match first
    let criteriaKey = Object.keys(rubric.criteria).find(
      key => key.toLowerCase() === competencyName.toLowerCase() || 
             key.toLowerCase().replace(/[^a-z0-9]/g, '-') === competencyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    )
    
    // Try partial match
    if (!criteriaKey) {
      criteriaKey = Object.keys(rubric.criteria).find(
        key => key.toLowerCase().includes(competencyName.toLowerCase()) ||
               competencyName.toLowerCase().includes(key.toLowerCase())
      )
    }
    
    if (!criteriaKey) return undefined
    
    const criteria = rubric.criteria[criteriaKey]
    return {
      description: criteria.description,
      scoring: criteria.scoring,
      weight: criteria.weight,
    }
  }

  // Compute recommended lessons based on weak competencies
  const weakCompetencies = scores
    .filter((s: any) => {
      const score = typeof s === 'number' ? s : (s.score || s || 0)
      return score > 0 && score < 3.0
    })
    .map((s: any) => {
      if (typeof s === 'object' && s.competencyName) {
        return s.competencyName
      }
      if (typeof s === 'object' && s.competency) {
        return s.competency
      }
      return String(s)
    })
    .filter(Boolean)

  // Map competencies to domains and get foundational lessons
  const getFoundationalLessonForDomain = (domainId: string) => {
    const domain = getDomainById(domainId)
    if (!domain || domain.modules.length === 0) return null

    const firstModule = domain.modules[0]
    if (!firstModule || firstModule.lessons.length === 0) return null

    const firstLesson = firstModule.lessons[0]
    return {
      domain: domainId,
      module: firstModule.id,
      lesson: firstLesson.id,
      url: `/library/curriculum/${domainId}/${firstModule.id}/${firstLesson.id}`,
      title: firstLesson.title,
    }
  }

  const allLessons = getAllLessonsFlat()
  const recommendedLessons: Array<{
    id: string
    title: string
    url: string
    competencyName: string
    reason: string
  }> = []

  weakCompetencies.slice(0, 5).forEach((competencyName: string) => {
    const domainId = getDomainIdForCompetency(competencyName)

    if (domainId) {
      const lesson = getFoundationalLessonForDomain(domainId)
      if (lesson) {
        const lessonId = `${lesson.domain}-${lesson.module}-${lesson.lesson}`
        if (!recommendedLessons.some(r => r.id === lessonId)) {
          recommendedLessons.push({
            id: lessonId,
            title: lesson.title,
            url: lesson.url,
            competencyName,
            reason: `Build foundational knowledge in ${competencyName} to improve your performance`,
          })
        }
      }
    } else {
      // Fallback: find lessons by keyword match
      const matchingLessons = allLessons
        .filter(l => 
          l.lessonTitle.toLowerCase().includes(competencyName.toLowerCase()) ||
          l.domainTitle.toLowerCase().includes(competencyName.toLowerCase())
        )
        .slice(0, 1)

      matchingLessons.forEach(lesson => {
        const lessonId = `${lesson.domain}-${lesson.moduleId}-${lesson.lessonId}`
        if (!recommendedLessons.some(r => r.id === lessonId) && recommendedLessons.length < 5) {
          recommendedLessons.push({
            id: lessonId,
            title: lesson.lessonTitle,
            url: `/library/curriculum/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`,
            competencyName,
            reason: `Strengthen your ${competencyName} skills`,
          })
        }
      })
    }
  })

  const recommendedItems = recommendedLessons.slice(0, 5)

  // Start score reveal animation
  useEffect(() => {
    if (debrief && !showScores) {
      setTimeout(() => setShowScores(true), 2000)
    }
  }, [debrief, showScores])

  const shareDebrief = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Debrief link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  if (debriefLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <LoadingState type="dashboard" />
        </div>
      </div>
    )
  }

  if (debriefError) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Failed to load debrief"
          message="Unable to load the simulation debrief. Please try again."
          error={debriefError}
          onRetry={() => window.location.reload()}
          showBackToDashboard={true}
        />
      </div>
    )
  }

  if (!simulation || !debrief) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Debrief not found"
          message="This simulation may not be completed yet or the debrief data is unavailable."
          showBackToDashboard={true}
          onRetry={undefined}
        />
      </div>
    )
  }

  const averageScore =
    scores.length > 0
      ? scores.reduce((sum: number, s: any) => sum + (s.score || s || 0), 0) / scores.length
      : 0

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          After-Action Report: {simulation.case?.title || 'Unknown Case'}
        </h1>
        <p className="text-sm text-gray-600">{simulation.case?.title || 'Unknown Case'}</p>
      </div>

      {/* Overall Score KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Overall Performance
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">
            {averageScore.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">out of 5.0</div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Competencies Assessed
          </div>
          <div className="text-3xl font-semibold text-gray-900 mb-1">
            {scores.length}
          </div>
          <div className="text-xs text-gray-500">competency areas</div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Completion Date
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            {simulation.completedAt
              ? new Date(simulation.completedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      {debrief.summaryText && (
        <div className="bg-white border border-gray-200 mb-12">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Performance Summary</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 leading-relaxed">{debrief.summaryText}</p>
          </div>
        </div>
      )}

      {/* Action Plan - Recommended Reading for Low Scores (Prominent, moved up) */}
      {showScores && recommendedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 mb-12">
          <div className="border-b border-blue-200 px-6 py-4 bg-blue-100">
            <h2 className="text-lg font-medium text-gray-900">Action Plan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Strengthen your weak competencies with these foundational lessons
            </p>
          </div>
          <div className="p-6">
            <RecommendedReading
              recommendations={recommendedItems}
              delay={0}
            />
          </div>
        </div>
      )}

      {/* Competency Analysis */}
      {showScores && scores.length > 0 && (
        <div className="mb-12">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-lg font-medium text-gray-900">Competency Analysis</h2>
          </div>
          <div className="space-y-4">
            {scores.map((score: any, index: number) => {
              const competencyName = score.competencyName || score.competency || 'Unknown'
              const rubricCriteria = getRubricCriteriaForCompetency(competencyName)
              
              return (
                <ScoreReveal
                  key={competencyName || index}
                  competencyName={competencyName}
                  score={score.score || score || 0}
                  maxScore={5}
                  justification={score.justification || score.feedback || ''}
                  delay={0}
                  rubricCriteria={rubricCriteria}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Share Buttons */}
      {showScores && scores.length > 0 && (
        <div className="mb-12">
          <ShareButtons
            simulationTitle={simulation.case?.title || 'Simulation'}
            scores={Object.fromEntries(
              scores.map((s: any) => [
                s.competencyName || s.competency || 'Unknown',
                s.score || s || 0,
              ])
            )}
            profileUrl={
              profileData?.profile?.username
                ? `${window.location.origin}/profile/${profileData.profile.username}`
                : undefined
            }
          />
        </div>
      )}

      {/* Action Buttons */}
      {showScores && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={shareDebrief} variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
            <Share2 className="h-4 w-4 mr-2" />
            Transmit Debrief
          </Button>
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            <Link href="/simulations">Deploy to Another Scenario</Link>
          </Button>
          <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      )}
    </div>
  )
}