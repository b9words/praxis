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
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Platform Analytics</h1>
        <p className="text-sm text-gray-600">Track user engagement and content performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-gray-400" />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{totalUsers}</div>
          <div className="text-xs text-gray-500 mt-1">{activeUsers} active</div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Simulations</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{totalSimulations}</div>
          <div className="text-xs text-gray-500 mt-1">
            {completedSimulations} completed ({completionRate}%)
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Learning Progress</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{averageProgress}%</div>
          <div className="text-xs text-gray-500 mt-1">Average completion</div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Content</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{contentPerformance.length}</div>
          <div className="text-xs text-gray-500 mt-1">Published cases</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 mb-12">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <p className="text-xs text-gray-500 mt-1">Last 10 completed simulations</p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.length > 0 ? (
            recentActivity.map((sim) => {
              const debriefScores = sim.debrief?.scores as any
              const avgScore = debriefScores
                ? Array.isArray(debriefScores)
                  ? debriefScores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) /
                    debriefScores.length
                  : 0
                : 0

              return (
                <div key={sim.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{sim.case.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {sim.user.fullName || sim.user.username} •{' '}
                      {sim.completedAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{avgScore.toFixed(1)}/5.0</span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Performance */}
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Content Performance</h2>
          <p className="text-xs text-gray-500 mt-1">Cases sorted by completion rate</p>
        </div>
        <div className="divide-y divide-gray-100">
          {contentPerformance.length > 0 ? (
            contentPerformance.map((caseItem) => {
              const total = caseItem.simulations.length
              const completed = caseItem.simulations.filter((s) => s.status === 'completed').length
              const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <div key={caseItem.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{caseItem.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {completed}/{total} completions ({completionRate}%)
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">No content data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
