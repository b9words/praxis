import LeaderboardTable from '@/components/community/LeaderboardTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCurrentUser } from '@/lib/auth/get-user'
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
          debrief: {
            select: {
              scores: true,
            },
          },
        },
      },
    },
    })
  } catch (error) {
    console.error('Error fetching global leaderboard:', error)
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
  } catch (error) {
    console.error('Error fetching weekly simulations:', error)
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
    <div className="max-w-5xl mx-auto py-12 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Performance Rankings</h1>
        <p className="mt-3 text-lg text-gray-600">Operative performance metrics across all engagements</p>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="global">All Time</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <LeaderboardTable entries={globalWithScores} currentUserId={user.id} />
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          {weeklyLeaderboard.length > 0 ? (
            <LeaderboardTable entries={weeklyLeaderboard} currentUserId={user.id} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No activity this week</p>
              <p className="text-sm mt-2">Be the first to complete a simulation!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
