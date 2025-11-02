import ExecemyRadarChart from '@/components/profile/ExecemyRadarChart'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getUserResidency } from '@/lib/auth/get-residency'
import { cache, CacheTags, getCachedUserData } from '@/lib/cache'
import { getUserAggregateScores } from '@/lib/database-functions'
import { isEnumError } from '@/lib/prisma-enum-fallback'
import { prisma } from '@/lib/prisma/server'
import { Award, ArrowRight, Calendar, Edit, Share2, Target } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ShareDossierButton from './ShareDossierButton'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  
  // Cache profile metadata
  const getCachedProfileMetadata = cache(
    async () => {
      const profile = await prisma.profile.findUnique({
        where: { username },
        select: {
          fullName: true,
          username: true,
          bio: true,
          isPublic: true,
        },
      })
      return profile
    },
    ['profile', 'metadata', username],
    {
      tags: [CacheTags.USERS, `user-${username}`],
      revalidate: 300, // 5 minutes
    }
  )
  
  const profile = await getCachedProfileMetadata()

  if (!profile || !profile.isPublic) {
    return {
      title: 'Profile',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3400'
  const ogImageUrl = `${baseUrl}/profile/${username}/opengraph-image`

  const title = `${profile.fullName || profile.username}'s Praxis Dossier`
  const description = profile.bio || `View ${profile.fullName || profile.username}'s professional dossier, including their competency matrix and a history of completed business simulations.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${baseUrl}/profile/${username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

/**
 * Generate analytical strengths summary from aggregate scores
 */
function generateAnalyticalStrengths(scores: Record<string, number>): string {
  const sortedScores = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 2)

  if (sortedScores.length === 0) {
    return 'Analysis pending. Complete simulations to build your competency profile.'
  }

  const competencyNames: Record<string, string> = {
    financialAcumen: 'Financial Acumen',
    strategicThinking: 'Strategic Thinking',
    marketAwareness: 'Market Awareness',
    riskManagement: 'Risk Management',
    leadershipJudgment: 'Leadership Judgment',
  }

  const topCompetencies = sortedScores.map(([key, score]) => ({
    name: competencyNames[key] || key,
    score,
  }))

  if (topCompetencies.length === 2) {
    return `Analysis indicates a significant aptitude in **${topCompetencies[0].name}** and **${topCompetencies[1].name}**. Operative consistently excels in scenarios requiring ${topCompetencies[0].name.toLowerCase()} and ${topCompetencies[1].name.toLowerCase()}.`
  } else if (topCompetencies.length === 1) {
    return `Analysis indicates a significant aptitude in **${topCompetencies[0].name}**. Operative consistently excels in scenarios requiring ${topCompetencies[0].name.toLowerCase()}.`
  }

  return 'Analysis indicates developing competency across multiple domains.'
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const currentUser = await getCurrentUser()

  const { username } = await params

  // Cache profile data (5 minutes revalidate, userId in key)
  const getCachedProfile = cache(
    async () => {
      const profile = await prisma.profile.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
          isPublic: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      return profile
    },
    ['profile', username],
    {
      tags: [CacheTags.USERS],
      revalidate: 300, // 5 minutes
    }
  )

  const profile = await getCachedProfile()

  if (!profile) {
    notFound()
  }

  // Check if profile is public or if it's the current user's profile
  const isOwnProfile = currentUser?.id === profile.id
  if (!profile.isPublic && !isOwnProfile) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-base font-medium text-gray-900 mb-2">This dossier is classified.</p>
          <p className="text-sm text-gray-600">
            Access is restricted by the operative.
          </p>
        </div>
      </div>
    )
  }

  // Get user residency for status badge
  let userResidency = null
  try {
    const residencyData = await getUserResidency(profile.id)
    userResidency = residencyData.currentResidency
  } catch (error) {
    // Ignore errors, status badge will just not show program year
  }

  // Cache aggregate scores (10 minutes revalidate, userId in key)
  const getCachedAggregateScores = getCachedUserData(
    profile.id,
    () => getUserAggregateScores(profile.id),
    ['aggregate', 'scores'],
    {
      tags: [CacheTags.USER_PROGRESS],
      revalidate: 600, // 10 minutes
    }
  )

  // Cache simulations list (5 minutes revalidate, userId in key)
  const getCachedSimulations = getCachedUserData(
    profile.id,
    async () => {
      let simulations: any[] = []
      try {
        simulations = await prisma.simulation.findMany({
          where: {
            userId: profile.id,
            status: 'completed',
          },
          include: {
            case: {
              select: {
                title: true,
              },
            },
            debrief: {
              select: {
                id: true,
                scores: true,
              },
            },
          },
          orderBy: {
            completedAt: 'desc',
          },
          take: 10,
        })
      } catch (error: any) {
        if (isEnumError(error)) {
          // Fallback: query without status filter, filter by completedAt
          try {
            const allSimulations = await prisma.simulation.findMany({
              where: {
                userId: profile.id,
              },
              include: {
                case: {
                  select: {
                    title: true,
                  },
                },
                debrief: {
                  select: {
                    id: true,
                    scores: true,
                  },
                },
              },
              orderBy: {
                completedAt: 'desc',
              },
              take: 10,
            })
            simulations = allSimulations.filter((s: any) => s.completedAt !== null)
          } catch (fallbackError) {
            console.error('Error fetching simulations (fallback):', fallbackError)
          }
        } else {
          console.error('Error fetching simulations:', error)
        }
      }
      return simulations
    },
    ['simulations', 'completed'],
    {
      tags: [CacheTags.SIMULATIONS],
      revalidate: 300, // 5 minutes
    }
  )

  const [aggregateScores, simulations] = await Promise.all([
    getCachedAggregateScores(),
    getCachedSimulations(),
  ])

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const lastUpdated = aggregateScores && Object.keys(aggregateScores).length > 0
    ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  // Generate analytical strengths
  const analyticalStrengths = aggregateScores ? generateAnalyticalStrengths(aggregateScores) : null

  // Helper to extract performance metrics from debrief scores
  function getPerformanceMetrics(debrief: any): string {
    if (!debrief?.scores) return ''
    
    const scores = debrief.scores as any
    const competencyNames: Record<string, string> = {
      financialAcumen: 'Financial Acumen',
      strategicThinking: 'Strategic Thinking',
      marketAwareness: 'Market Awareness',
      riskManagement: 'Risk Management',
      leadershipJudgment: 'Leadership Judgment',
    }

    const scoreArray = Array.isArray(scores) 
      ? scores 
      : Object.entries(scores).map(([key, value]: [string, any]) => ({
          competency: competencyNames[key] || key,
          score: typeof value === 'number' ? value : (value?.score || 0),
        }))

    const topScores = scoreArray
      .filter((s: any) => {
        const score = typeof s === 'number' ? s : (s.score || 0)
        return score > 0
      })
      .sort((a: any, b: any) => {
        const scoreA = typeof a === 'number' ? a : (a.score || 0)
        const scoreB = typeof b === 'number' ? b : (b.score || 0)
        return scoreB - scoreA
      })
      .slice(0, 2)
      .map((s: any) => {
        if (typeof s === 'number') return `Score: ${s.toFixed(1)}/5`
        return `${s.competency || 'Competency'}: ${s.score.toFixed(1)}/5`
      })

    return topScores.join(', ')
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {/* Profile Header: The Operative's Identity */}
      <div className="bg-white border border-gray-200 mb-12">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-gray-300">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-xl bg-gray-100 text-gray-700">
                {profile.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-medium text-gray-900 mb-1">
                    {profile.fullName || profile.username}
                  </h1>
                  <p className="text-sm text-gray-600 mb-3">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-sm text-gray-700 leading-relaxed max-w-2xl">{profile.bio}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  {isOwnProfile ? (
                    <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
                      <Link href="/profile/edit">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Dossier
                      </Link>
                    </Button>
                  ) : profile.isPublic ? (
                    <ShareDossierButton username={username} />
                  ) : null}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300 rounded-none">
                  Status: Active Operative
                </Badge>
                {userResidency && (
                  <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300 rounded-none">
                    Program Year: {userResidency}
                  </Badge>
                )}
                {profile.isPublic && (
                  <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300 rounded-none">
                    Credential: Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Matrix */}
      {aggregateScores && Object.keys(aggregateScores).length > 0 && (
        <div className="bg-white border border-gray-200 mb-12">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Competency Matrix</h2>
            <p className="text-xs text-gray-500 mt-1">
              Aggregate performance across all completed simulations. {lastUpdated && `Last updated: ${lastUpdated}`}
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ExecemyRadarChart data={aggregateScores} />
              </div>
              {analyticalStrengths && (
                <div className="lg:col-span-1">
                  <Card className="border-gray-300 rounded-none h-full">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Analytical Strengths
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{
                        __html: analyticalStrengths.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Engagement History */}
      {simulations.length > 0 && (
        <div className="bg-white border border-gray-200 mb-12">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Engagement History</h2>
            <p className="text-xs text-gray-500 mt-1">Log of all completed simulations and after-action reports.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {simulations.map((sim) => {
              const performanceMetrics = sim.debrief ? getPerformanceMetrics(sim.debrief) : ''

              return (
                <div
                  key={sim.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-medium text-gray-900">
                        Case: {sim.case.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      Completed: {sim.completedAt ? new Date(sim.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                    </p>
                    {performanceMetrics && (
                      <p className="text-xs text-gray-600 mt-1">
                        Performance Metrics: {performanceMetrics}
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-gray-300 hover:border-gray-400 rounded-none">
                    <Link href={`/debrief/${sim.id}`}>
                      Review Debrief
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {simulations.length === 0 && (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <Target className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-2">No completed engagements</h3>
          <p className="text-sm text-gray-600 mb-6">Complete your first simulation to build your engagement history</p>
          {isOwnProfile && (
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
              <Link href="/simulations">Deploy to Scenario</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
