import LeaderboardTable from '@/components/community/LeaderboardTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCurrentUser } from '@/lib/auth/get-user'
import { isEnumError } from '@/lib/prisma-enum-fallback'
import { prisma } from '@/lib/prisma/server'

export default async function LeaderboardPage() {
  const user = await getCurrentUser()

  // Auth protection is handled by middleware
  if (!user) {
    return null
  }

  // Get global leaderboard (all time) with error handling
  let globalLeaderboard: any[] = []
  try {
    globalLeaderboard = await prisma.profile.findMany({
      take: 50,
      orderBy: [
        {
          simulations: {
            _count: 'desc',
          },
        },
      ],
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        simulations: {
          where: {
            status: 'completed',
          },
          select: {
            completedAt: true,
            debrief: {
              select: {
                scores: true,
              },
            },
          },
        },
      },
    })
  } catch (error: any) {
    if (isEnumError(error)) {
      // Fallback: query without status filter, filter by completedAt
      try {
        const allProfiles = await prisma.profile.findMany({
          take: 50,
          orderBy: [
            {
              simulations: {
                _count: 'desc',
              },
            },
          ],
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            simulations: {
              select: {
                completedAt: true,
                debrief: {
                  select: {
                    scores: true,
                  },
                },
              },
            },
          },
        })
        // Filter simulations to only completed ones (completedAt is not null)
        globalLeaderboard = allProfiles.map((profile) => ({
          ...profile,
          simulations: profile.simulations.filter((s: any) => s.completedAt !== null),
        }))
      } catch (fallbackError) {
        console.error('Error fetching global leaderboard (fallback):', fallbackError)
      }
    } else {
      console.error('Error fetching global leaderboard:', error)
    }
  }

  // Calculate average scores for global leaderboard
  const globalWithScores = globalLeaderboard.map((profile: any) => {
    const completedSims = profile.simulations.filter((s: any) => s.debrief)
    const allScores: number[] = []

    completedSims.forEach((sim: any) => {
      if (sim.debrief?.scores) {
        const scores = sim.debrief.scores as any
        const scoreArray = Array.isArray(scores) ? scores : Object.values(scores)
        scoreArray.forEach((s: any) => {
          if (typeof s === 'number') {
            allScores.push(s)
          } else if (s?.score) {
            allScores.push(s.score)
          }
        })
      }
    })

    const averageScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0

    return {
      id: profile.id,
      username: profile.username,
      full_name: profile.fullName,
      avatar_url: profile.avatarUrl,
      simulations_completed: completedSims.length,
      articles_completed: 0, // Would need to query separately
      average_score: averageScore,
      last_activity: new Date().toISOString(),
    }
  })

  globalWithScores.sort((a, b) => {
    if (b.average_score !== a.average_score) {
      return b.average_score - a.average_score
    }
    return b.simulations_completed - a.simulations_completed
  })

  // Get weekly leaderboard (simulations completed in last 7 days)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  let weeklySimulations: any[] = []
  try {
    weeklySimulations = await prisma.simulation.findMany({
      where: {
        status: 'completed',
        completedAt: {
          gte: oneWeekAgo,
        },
      },
      include: {
        debrief: {
          select: {
            scores: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    })
  } catch (error: any) {
    if (isEnumError(error)) {
      // Fallback: query without status filter, filter by completedAt
      try {
        const allSimulations = await prisma.simulation.findMany({
          where: {
            completedAt: {
              gte: oneWeekAgo,
              not: null,
            },
          },
          include: {
            debrief: {
              select: {
                scores: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        })
        // Filter to only completed (completedAt is not null and >= oneWeekAgo)
        weeklySimulations = allSimulations.filter((s: any) => s.completedAt !== null && new Date(s.completedAt) >= oneWeekAgo)
      } catch (fallbackError) {
        console.error('Error fetching weekly simulations (fallback):', fallbackError)
      }
    } else {
      console.error('Error fetching weekly simulations:', error)
    }
  }

  // Aggregate weekly scores
  const weeklyMap = new Map<
    string,
    {
      count: number
      totalScore: number
      profile: {
        id: string
        username: string
        fullName: string | null
        avatarUrl: string | null
      }
    }
  >()

  weeklySimulations.forEach((sim) => {
    if (sim.debrief?.scores) {
      const scores = sim.debrief.scores as any
      const scoreArray = Array.isArray(scores) ? scores : Object.values(scores)
      const avgScore =
        scoreArray.length > 0
          ? scoreArray.reduce((sum: number, s: any) => sum + (s?.score || s || 0), 0) / scoreArray.length
          : 0

      const existing = weeklyMap.get(sim.userId)
      weeklyMap.set(sim.userId, {
        count: (existing?.count || 0) + 1,
        totalScore: (existing?.totalScore || 0) + avgScore,
        profile: sim.user,
      })
    }
  })

  // Build weekly leaderboard
  const weeklyLeaderboard = Array.from(weeklyMap.values())
    .map((entry) => ({
      id: entry.profile.id,
      username: entry.profile.username,
      full_name: entry.profile.fullName,
      avatar_url: entry.profile.avatarUrl,
      simulations_completed: entry.count,
      articles_completed: 0,
      average_score: entry.totalScore / entry.count,
      last_activity: new Date().toISOString(),
    }))
    .sort((a, b) => {
      if (b.average_score !== a.average_score) {
        return b.average_score - a.average_score
      }
      return b.simulations_completed - a.simulations_completed
    })

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Performance Rankings</h1>
        <p className="text-sm text-gray-600">Operative performance metrics across all engagements</p>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-transparent p-0 rounded-none border-b border-gray-200">
          <TabsTrigger value="global" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent">All Time</TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <LeaderboardTable entries={globalWithScores} currentUserId={user.id} />
        </TabsContent>

        <TabsContent value="weekly">
          {weeklyLeaderboard.length > 0 ? (
            <LeaderboardTable entries={weeklyLeaderboard} currentUserId={user.id} />
          ) : (
            <div className="bg-white border border-gray-200 p-12 text-center">
              <p className="text-sm font-medium text-gray-900 mb-2">No activity this week</p>
              <p className="text-xs text-gray-500">Be the first to complete a simulation</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
