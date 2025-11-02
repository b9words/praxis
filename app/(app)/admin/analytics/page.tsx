import { cache, CacheTags } from '@/lib/cache'
import { prisma } from '@/lib/prisma/server'
import { Activity, Award, BookOpen, TrendingUp, Users } from 'lucide-react'

export default async function AdminAnalyticsPage() {
  // Cache expensive analytics queries - revalidate every 5 minutes
  const analyticsData = await cache(
    async () => {
      const [
        totalUsers,
        activeUsers,
        totalSimulations,
        completedSimulations,
        recentActivity,
        contentPerformance,
        // Optimize: Only fetch aggregated progress stats instead of all records
        progressStats,
        // New metrics
        learningPathStats,
        domainCompletionStats,
        certificateStats,
        emailEngagementStats,
      ] = await Promise.all([
        // Total users
        prisma.profile.count(),

        // Active users (completed at least one simulation) - use count with distinct
        prisma.simulation.groupBy({
          by: ['userId'],
          where: {
            status: 'completed',
          },
        }).then((result: Array<{ userId: string }>) => result.length),

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

        // Content performance (cases by completion) - limit to top 10
        prisma.case.findMany({
          where: {
            status: 'published',
          },
          include: {
            _count: {
              select: {
                simulations: true, // Total simulations
              },
            },
            simulations: {
              where: {
                status: 'completed',
              },
              select: {
                id: true,
              },
            },
          },
          take: 10,
        }),

        // Optimized: Aggregate progress stats instead of fetching all records
        prisma.userLessonProgress.aggregate({
          _avg: {
            progressPercentage: true,
          },
          _count: {
            id: true,
          },
        }),

        // Learning path completion stats
        (async () => {
          const publishedPaths = await prisma.learningPath.findMany({
            where: { status: 'published' },
            include: {
              items: true,
            },
          })

          const pathCompletionPromises = publishedPaths.map(async (path: any) => {
            // Count users who have completed all items in this path
            const totalItems = path.items.length
            if (totalItems === 0) return { pathId: path.id, pathTitle: path.title, completionRate: 0, totalUsers: 0 }

            // This is a simplified check - in reality, we'd need to check lesson/case completion
            // For now, we'll estimate based on users who have completed at least one item
            const usersWithProgress = await prisma.userLessonProgress.groupBy({
              by: ['userId'],
              where: {
                OR: path.items
                  .filter((item: any) => item.type === 'lesson')
                  .map((item: any) => ({
                    domainId: item.domain || '',
                    moduleId: item.module || '',
                    lessonId: item.lesson || '',
                  })),
              },
            })

            // Count completions for this path's lessons
            const completions = await prisma.userLessonProgress.count({
              where: {
                status: 'completed',
                OR: path.items
                  .filter((item: any) => item.type === 'lesson')
                  .map((item: any) => ({
                    domainId: item.domain || '',
                    moduleId: item.module || '',
                    lessonId: item.lesson || '',
                  })),
              },
            })

            const completionRate = totalItems > 0 && usersWithProgress.length > 0
              ? Math.round((completions / (totalItems * usersWithProgress.length)) * 100)
              : 0

            return {
              pathId: path.id,
              pathTitle: path.title,
              completionRate,
              totalUsers: usersWithProgress.length,
            }
          })

          const pathStats = await Promise.all(pathCompletionPromises)
          return {
            totalPaths: publishedPaths.length,
            averageCompletionRate: pathStats.length > 0
              ? Math.round(pathStats.reduce((sum: number, p: any) => sum + p.completionRate, 0) / pathStats.length)
              : 0,
            pathDetails: pathStats,
          }
        })(),

        // Domain completion stats
        (async () => {
          const domainCompletions = await prisma.domainCompletion.findMany({
            include: {
              user: {
                select: {
                  id: true,
                },
              },
            },
          })

          const completionsByDomain = domainCompletions.reduce((acc: Record<string, number>, dc: any) => {
            if (!acc[dc.domainId]) {
              acc[dc.domainId] = 0
            }
            acc[dc.domainId]++
            return acc
          }, {} as Record<string, number>)

          const totalCompletions = domainCompletions.length
          const uniqueUsersCompleted = new Set(domainCompletions.map((dc: any) => dc.userId)).size

          return {
            totalCompletions,
            uniqueUsersCompleted,
            completionsByDomain,
            totalUniqueDomains: Object.keys(completionsByDomain).length,
          }
        })(),

        // Certificate stats
        (async () => {
          const certificates = await prisma.domainCompletion.findMany({
            where: {
              certificateGeneratedAt: {
                not: null,
              },
            },
            select: {
              id: true,
              domainId: true,
              certificateGeneratedAt: true,
            },
          })

          return {
            totalGenerated: certificates.length,
            certificatesGenerated: certificates.length,
          }
        })(),

        // Email engagement stats
        (async () => {
          // Track emails sent via notifications (we can extend this with a dedicated email_log table later)
          const emailNotifications = await prisma.notification.findMany({
            where: {
              type: {
                in: ['weekly_summary', 'simulation_complete', 'domain_complete'],
              },
            },
            select: {
              id: true,
              type: true,
              read: true,
              createdAt: true,
            },
          })

          const sentByType = emailNotifications.reduce((acc, notif) => {
            if (!acc[notif.type]) {
              acc[notif.type] = { sent: 0, read: 0 }
            }
            acc[notif.type].sent++
            if (notif.read) {
              acc[notif.type].read++
            }
            return acc
          }, {} as Record<string, { sent: number; read: number }>)

          const totalSent = emailNotifications.length
          const totalRead = emailNotifications.filter(n => n.read).length
          const openRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0

          return {
            totalSent,
            totalRead,
            openRate,
            byType: sentByType,
          }
        })(),
      ])

      return {
        totalUsers,
        activeUsers,
        totalSimulations,
        completedSimulations,
        recentActivity,
        contentPerformance,
        averageProgress: progressStats._avg.progressPercentage || 0,
        totalProgressRecords: progressStats._count.id,
        learningPathStats,
        domainCompletionStats,
        certificateStats,
        emailEngagementStats,
      }
    },
    ['admin', 'analytics'],
    {
      tags: [CacheTags.USER_PROGRESS, CacheTags.DASHBOARD, 'analytics', 'admin-analytics'],
      revalidate: 300, // 5 minutes
    }
  )()

  const {
    totalUsers,
    activeUsers,
    totalSimulations,
    completedSimulations,
    recentActivity,
    contentPerformance,
    averageProgress,
    learningPathStats,
    domainCompletionStats,
    certificateStats,
    emailEngagementStats,
  } = analyticsData

  // Calculate completion rate
  const completionRate =
    totalSimulations > 0 ? Math.round((completedSimulations / totalSimulations) * 100) : 0

  // Average progress already calculated in cached query
  const averageProgressRounded = Math.round(averageProgress)

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
          <div className="text-3xl font-semibold text-gray-900">{averageProgressRounded}%</div>
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

      {/* New Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-gray-400" />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Learning Paths</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{learningPathStats.totalPaths}</div>
          <div className="text-xs text-gray-500 mt-1">
            {learningPathStats.averageCompletionRate}% avg completion
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Domain Completions</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{domainCompletionStats.totalCompletions}</div>
          <div className="text-xs text-gray-500 mt-1">
            {domainCompletionStats.uniqueUsersCompleted} users • {domainCompletionStats.totalUniqueDomains} domains
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-gray-400" />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Certificates</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{certificateStats.totalGenerated}</div>
          <div className="text-xs text-gray-500 mt-1">Certificates generated</div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Engagement</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{emailEngagementStats.openRate}%</div>
          <div className="text-xs text-gray-500 mt-1">
            {emailEngagementStats.totalRead}/{emailEngagementStats.totalSent} opened
          </div>
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
            recentActivity.map((sim: any) => {
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
                      {sim.completedAt ? new Date(sim.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
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
            contentPerformance.map((caseItem: any) => {
              const total = caseItem._count?.simulations || 0
              const completed = caseItem.simulations?.length || 0
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

      {/* Learning Path Performance */}
      {learningPathStats.pathDetails.length > 0 && (
        <div className="bg-white border border-gray-200 mb-12">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Learning Path Performance</h2>
            <p className="text-xs text-gray-500 mt-1">Completion rates by learning path</p>
          </div>
          <div className="divide-y divide-gray-100">
            {learningPathStats.pathDetails.map((path: any) => (
              <div key={path.pathId} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="text-base font-medium text-gray-900">{path.pathTitle}</h4>
                  <p className="text-xs text-gray-500 mt-1">{path.totalUsers} users enrolled</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{path.completionRate}%</div>
                  <div className="text-xs text-gray-500">completion rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Completion Breakdown */}
      {domainCompletionStats.totalUniqueDomains > 0 && (
        <div className="bg-white border border-gray-200 mb-12">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Domain Completions</h2>
            <p className="text-xs text-gray-500 mt-1">Completions by domain</p>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(domainCompletionStats.completionsByDomain)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 10)
              .map(([domainId, count]) => (
                <div key={domainId} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{domainId}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{count as number}</div>
                    <div className="text-xs text-gray-500">completions</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Email Engagement Details */}
      {Object.keys(emailEngagementStats.byType).length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Email Engagement</h2>
            <p className="text-xs text-gray-500 mt-1">Performance by email type</p>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(emailEngagementStats.byType).map(([type, stats]) => {
              const openRate = stats.sent > 0 ? Math.round((stats.read / stats.sent) * 100) : 0
              return (
                <div key={type} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{stats.sent} sent</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{openRate}%</div>
                    <div className="text-xs text-gray-500">{stats.read} opened</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
