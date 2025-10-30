import PraxisRadarChart from '@/components/profile/PraxisRadarChart'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getUserAggregateScores } from '@/lib/database-functions'
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium text-gray-900">This profile is private</p>
            <p className="text-sm text-gray-600 mt-2">
              This user has chosen to keep their profile private.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get aggregate scores
  const aggregateScores = await getUserAggregateScores(profile.id)

  // Get completed simulations
  const simulations = await prisma.simulation.findMany({
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {profile.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profile.fullName || profile.username}'s Dossier</h1>
                    <p className="text-gray-600">@{profile.username}</p>
                    {profile.bio && <p className="mt-2 text-gray-700">{profile.bio}</p>}
                  </div>
                  {isOwnProfile && (
                    <Button asChild variant="outline">
                      <Link href="/profile/edit">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Dossier
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Member since {memberSince}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {totalSimulations} simulation{totalSimulations !== 1 ? 's' : ''} completed
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Avg Score: {averageScore.toFixed(1)}/5.0
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Praxis Profile */}
        {aggregateScores && (
          <Card>
            <CardHeader>
              <CardTitle>Competency Matrix</CardTitle>
              <CardDescription>Your competency scores across all completed simulations</CardDescription>
            </CardHeader>
            <CardContent>
              <PraxisRadarChart data={aggregateScores} />
            </CardContent>
          </Card>
        )}

        {/* Completed Simulations */}
        {simulations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Engagement History</CardTitle>
              <CardDescription>Your completed simulations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{sim.case.title}</h3>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Award className="h-3 w-3 mr-1" />
                            {score.toFixed(1)}/5.0
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Completed {sim.completedAt?.toLocaleDateString()}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/debrief/${sim.id}`}>View Debrief</Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {simulations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No completed simulations yet</p>
              <Button asChild className="mt-4">
                <Link href="/simulations">Start Your First Simulation</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
