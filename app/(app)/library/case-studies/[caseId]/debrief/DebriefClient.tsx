'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Star, TrendingUp, TrendingDown, ArrowRight, BarChart3, Award, Users } from 'lucide-react'
import RadarComparison from '@/components/debrief/RadarComparison'
import PeerMetrics from '@/components/debrief/PeerMetrics'
import CommunityResponses from '@/components/case-study/CommunityResponses'
import MarkdownRenderer from '@/components/ui/Markdown'
import CompetencyTable from '@/components/case-study/CompetencyTable'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { getDomainIdForCompetency } from '@/lib/competency-mapping'
import { getAllLessonsFlat } from '@/lib/curriculum-data'

interface DebriefClientProps {
  caseId: string
  caseTitle: string
  debrief: any
  previousScores: any
  currentScores: any
  decisionSummary: string
  keyInsight: string
  goldStandardContent: string | null
  weaknessRecommendation: { caseId: string; title: string; description: string; url: string } | null
  strengthRecommendation: { caseId: string; title: string; description: string; url: string } | null
  weakestCompetency: string | null
  strongestCompetency: string | null
  userId: string
}

export default function DebriefClient({
  caseId,
  caseTitle,
  debrief,
  previousScores,
  currentScores,
  decisionSummary,
  keyInsight,
  goldStandardContent,
  weaknessRecommendation,
  strengthRecommendation,
  weakestCompetency,
  strongestCompetency,
  userId,
}: DebriefClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview')
  const [hasViewedPeerBenchmark, setHasViewedPeerBenchmark] = useState(false)
  const [goldStandardLoaded, setGoldStandardLoaded] = useState(false)
  const [communityLoaded, setCommunityLoaded] = useState(false)

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview'
    if (tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams, activeTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
    
    // Lazy load content
    if (value === 'gold-standard' && !goldStandardLoaded) {
      setGoldStandardLoaded(true)
    }
    if (value === 'community' && !communityLoaded) {
      setCommunityLoaded(true)
    }
  }

  const scores = (debrief.scores as any[]) || []
  const radarData = debrief.radarChartData as any

  // Get lesson URL for a competency
  const getLessonUrlForCompetency = useMemo(() => {
    return (competencyName: string): string | null => {
      const domainId = getDomainIdForCompetency(competencyName)
      if (!domainId) return null

      const allLessons = getAllLessonsFlat()
      const domainLesson = allLessons.find(
        (l) => l.domain === domainId
      )

      if (domainLesson) {
        return `/library/curriculum/${domainLesson.domain}/${domainLesson.moduleId}/${domainLesson.lessonId}`
      }

      return null
    }
  }, [])

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left Sidebar - Summary & Navigation */}
      <aside className="hidden lg:flex flex-col w-[300px] border-r border-gray-200 bg-white flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Executive Debrief</h1>
          <p className="text-sm text-gray-600">{caseTitle}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Quick Summary</h2>
            <p className="text-xs text-gray-600 mb-4">{decisionSummary}</p>
            <p className="text-xs text-gray-700">{keyInsight}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Competencies</h2>
            <div className="space-y-2">
              {scores.map((score: any, index: number) => (
                <div key={score.competencyName || index} className="text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{score.competencyName || 'Unknown'}</span>
                    <span className="font-medium text-gray-900">{(score.score || 0).toFixed(1)}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-6">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Executive Debrief</h1>
            <p className="text-sm text-gray-600">{caseTitle}</p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6 bg-gray-100 rounded-none h-10">
              <TabsTrigger value="overview" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="competencies" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Award className="h-4 w-4 mr-2" />
                Competencies
              </TabsTrigger>
              <TabsTrigger value="gold-standard" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Star className="h-4 w-4 mr-2" />
                Gold Standard
              </TabsTrigger>
              <TabsTrigger value="community" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4 mr-2" />
                Community
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-0">

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Overall Score
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {scores.length > 0
                        ? (scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / scores.length).toFixed(1)
                        : '0.0'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">out of 5.0</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Competencies
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">{scores.length}</div>
                    <div className="text-xs text-gray-500 mt-1">assessed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Key Insight
                    </div>
                    <div className="text-sm text-gray-900 line-clamp-2">{keyInsight}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadarComparison beforeData={previousScores} afterData={currentScores} />
                </CardContent>
              </Card>

              {/* Decision Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Decision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">{decisionSummary}</p>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {(weaknessRecommendation || strengthRecommendation) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weaknessRecommendation && weakestCompetency && (
                    <Card className="border-2 border-orange-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-orange-600" />
                          Shore Up: {weakestCompetency}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600 mb-3">{weaknessRecommendation.description}</p>
                        <Link href={weaknessRecommendation.url}>
                          <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none text-xs">
                            Start Challenge
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                  {strengthRecommendation && strongestCompetency && (
                    <Card className="border-2 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Build On: {strongestCompetency}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600 mb-3">{strengthRecommendation.description}</p>
                        <Link href={strengthRecommendation.url}>
                          <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none text-xs">
                            Start Challenge
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Competencies Tab */}
            <TabsContent value="competencies" className="mt-0">
              <CompetencyTable
                scores={scores}
                getLessonUrl={getLessonUrlForCompetency}
                expandedByDefault={false}
              />
            </TabsContent>

            {/* Gold Standard Tab */}
            <TabsContent value="gold-standard" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gold Standard Comparison</CardTitle>
                  <p className="text-xs text-gray-600 mt-1">
                    See what excellence looks like for this case study
                  </p>
                </CardHeader>
                <CardContent className="overflow-auto max-h-[calc(100vh-var(--header-h)-16rem)]">
                  {goldStandardLoaded && goldStandardContent ? (
                    <div className="prose prose-sm max-w-none">
                      <MarkdownRenderer content={goldStandardContent} />
                    </div>
                  ) : goldStandardLoaded && !goldStandardContent ? (
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Gold standard exemplar not available for this case study.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Loading gold standard content...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Community Tab */}
            <TabsContent value="community" className="mt-0 space-y-6">
              <div onMouseEnter={() => setHasViewedPeerBenchmark(true)}>
                <PeerMetrics caseId={caseId} />
              </div>
              {communityLoaded && (
                <CommunityResponses
                  caseId={caseId}
                  userId={userId}
                  isCompleted={true}
                  headerSlot={
                    <div>
                      <h2 className="text-base font-medium text-gray-900">Community Responses</h2>
                      <p className="text-xs text-gray-600 mt-1">
                        See how others approached this case study
                      </p>
                    </div>
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

