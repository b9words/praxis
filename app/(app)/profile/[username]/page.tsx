import PraxisRadarChart from '@/components/profile/PraxisRadarChart'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getUserAggregateScores } from '@/lib/database-functions'
import { isEnumError } from '@/lib/prisma-enum-fallback'
import { prisma } from '@/lib/prisma/server'
import { Award, Calendar, Edit, Target, TrendingUp } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  const profile = await prisma.profile.findUnique({
    where: { username },
    select: {
      fullName: true,
      username: true,
      bio: true,
      isPublic: true,
    },
  })

  if (!profile || !profile.isPublic) {
    return {
      title: 'Profile',
    }
  }

  return {
    title: `${profile.fullName || profile.username} | Praxis Profile`,
    description: profile.bio || `View ${profile.fullName || profile.username}'s Praxis profile and competency scores.`,
    openGraph: {
      title: `${profile.fullName || profile.username} | Praxis Profile`,
      description: profile.bio || `View ${profile.fullName || profile.username}'s Praxis profile.`,
      type: 'profile',
    },
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const currentUser = await getCurrentUser()

  const { username } = await params

  // Fetch profile by username
  // Exclude email_notifications_enabled as it may not exist in all database instances
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

  if (!profile) {
    notFound()
  }

  // Check if profile is public or if it's the current user's profile
  const isOwnProfile = currentUser?.id === profile.id
  if (!profile.isPublic && !isOwnProfile) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-base font-medium text-gray-900 mb-2">This profile is private</p>
          <p className="text-sm text-gray-600">
            This user has chosen to keep their profile private.
          </p>
        </div>
      </div>
    )
  }

  // Get aggregate scores
  const aggregateScores = await getUserAggregateScores(profile.id)

  // Get completed simulations with enum fallback
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
        debrief: true,
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
            debrief: true,
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

  // Calculate statistics
  const totalSimulations = simulations.length
  const averageScore =
    simulations.length > 0
      ? simulations.reduce((sum, sim) => {
          if (sim.debrief && sim.debrief.scores) {
            const scores = sim.debrief.scores as any
            const scoreArray = Array.isArray(scores) ? scores : Object.values(scores)
            const avgScore =
              scoreArray.reduce((s: number, score: any) => s + (score.score || score), 0) / scoreArray.length
            return sum + avgScore
          }
          return sum
        }, 0) / simulations.length
      : 0

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 mb-12">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-20 w-20 border border-gray-300">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-lg bg-gray-100 text-gray-700">
                {profile.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-medium text-gray-900 mb-1">{profile.fullName || profile.username}'s Dossier</h1>
                  <p className="text-sm text-gray-600">@{profile.username}</p>
                  {profile.bio && <p className="mt-3 text-sm text-gray-700">{profile.bio}</p>}
                </div>
                {isOwnProfile && (
                  <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
                    <Link href="/profile/edit">
                      <Edit className="h-4 w-4 mr-2" />
                      Update Dossier
                    </Link>
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Member since {memberSince}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {totalSimulations} {totalSimulations === 1 ? 'engagement' : 'engagements'} completed
                </div>
                {totalSimulations > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Average score: {averageScore.toFixed(1)}/5.0
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Matrix */}
      {aggregateScores && (
        <div className="bg-white border border-gray-200 mb-12">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Competency Matrix</h2>
            <p className="text-xs text-gray-500 mt-1">Competency scores across all completed engagements</p>
          </div>
          <div className="p-6">
            <PraxisRadarChart data={aggregateScores} />
          </div>
        </div>
      )}

      {/* Engagement History */}
      {simulations.length > 0 && (
        <div className="bg-white border border-gray-200 mb-12">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Engagement History</h2>
            <p className="text-xs text-gray-500 mt-1">Completed simulations</p>
          </div>
          <div className="divide-y divide-gray-100">
            {simulations.map((sim) => {
              const debrief = sim.debrief
              let score = 0
              if (debrief && debrief.scores) {
                const scores = debrief.scores as any
                const scoreArray = Array.isArray(scores) ? scores : Object.values(scores)
                score = scoreArray.reduce((s: number, sc: any) => s + (sc.score || sc), 0) / scoreArray.length
              }

              return (
                <div
                  key={sim.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-medium text-gray-900">{sim.case.title}</h3>
                      <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                        <Award className="h-3 w-3 mr-1" />
                        {score.toFixed(1)}/5.0
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Completed {sim.completedAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-gray-300 hover:border-gray-400 rounded-none">
                    <Link href={`/debrief/${sim.id}`}>View Debrief</Link>
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
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            <Link href="/simulations">Deploy to Scenario</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
