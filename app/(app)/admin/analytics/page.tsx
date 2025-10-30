import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { Activity, Award, BookOpen, TrendingUp, Users } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AdminAnalyticsPage() {
  try {
    await requireRole(['admin'])
  } catch {
    redirect('/dashboard')
  }

  // Fetch analytics data
  const [
    totalUsers,
    activeUsers,
    totalSimulations,
    completedSimulations,
    recentActivity,
    contentPerformance,
    userProgress,
  ] = await Promise.all([
    // Total users
    prisma.profile.count(),

    // Active users (completed at least one simulation)
    prisma.simulation
      .findMany({
        where: {
          status: 'completed',
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      })
      .then((result) => result.length),

    // Total simulations started
    prisma.simulation.count(),

    // Completed simulations
    prisma.simulation.count({
      where: {
        status: 'completed',
      },
    }),

    // Recent activity (last 10 completed simulations)
    prisma.simulation.findMany({
      where: {
        status: 'completed',
      },
      include: {
        case: {
          select: {
            title: true,
          },
        },
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
        debrief: {
          select: {
            scores: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 10,
    }),

    // Content performance (cases by completion)
    prisma.case.findMany({
      where: {
        status: 'published',
      },
      include: {
        simulations: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      take: 10,
    }),

    // User progress overview
    prisma.userLessonProgress.findMany({
      select: {
        status: true,
        progressPercentage: true,
      },
    }),
  ])

  // Calculate completion rate
  const completionRate =
    totalSimulations > 0 ? Math.round((completedSimulations / totalSimulations) * 100) : 0

  // Calculate average progress
  const averageProgress =
    userProgress.length > 0
      ? Math.round(
          userProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / userProgress.length
        )
      : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="mt-2 text-gray-600">Track user engagement and content performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
            <p className="text-sm text-gray-500 mt-1">{activeUsers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Simulations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSimulations}</div>
            <p className="text-sm text-gray-500 mt-1">
              {completedSimulations} completed ({completionRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageProgress}%</div>
            <p className="text-sm text-gray-500 mt-1">Average completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contentPerformance.length}</div>
            <p className="text-sm text-gray-500 mt-1">Published cases</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 10 completed simulations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((sim) => {
                const debriefScores = sim.debrief?.scores as any
                const avgScore = debriefScores
                  ? Array.isArray(debriefScores)
                    ? debriefScores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) /
                      debriefScores.length
                    : 0
                  : 0

                return (
                  <div key={sim.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium text-gray-900">{sim.case.title}</h4>
                      <p className="text-sm text-gray-600">
                        {sim.user.fullName || sim.user.username} •{' '}
                        {sim.completedAt?.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold">{avgScore.toFixed(1)}/5.0</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* Content Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Content Performance</CardTitle>
          <CardDescription>Cases sorted by completion rate</CardDescription>
        </CardHeader>
        <CardContent>
          {contentPerformance.length > 0 ? (
            <div className="space-y-3">
              {contentPerformance.map((caseItem) => {
                const total = caseItem.simulations.length
                const completed = caseItem.simulations.filter((s) => s.status === 'completed').length
                const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

                return (
                  <div key={caseItem.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h4 className="font-medium text-gray-900">{caseItem.title}</h4>
                      <p className="text-sm text-gray-600">
                        {completed}/{total} completions ({completionRate}%)
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No content data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
