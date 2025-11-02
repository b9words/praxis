import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
import Link from 'next/link'

export default async function AdminPage() {
  // Cache statistics queries (5 minutes revalidate)
  const getCachedStats = cache(
    async () => {
      const [articleCount, caseCount, userCount, simulationCount] = await Promise.all([
        prisma.article.count(),
        prisma.case.count(),
        prisma.profile.count(),
        prisma.simulation.count({
          where: {
            status: 'completed',
          },
        }),
      ])
      return { articleCount, caseCount, userCount, simulationCount }
    },
    ['admin', 'dashboard', 'stats'],
    {
      tags: [CacheTags.ADMIN, CacheTags.ARTICLES, CacheTags.CASES, CacheTags.USERS, CacheTags.SIMULATIONS],
      revalidate: 300, // 5 minutes
    }
  )

  // Cache recent articles/cases lists (2 minutes revalidate)
  const getCachedRecentContent = cache(
    async () => {
      const [articles, cases] = await Promise.all([
        prisma.article.findMany({
          include: {
            competency: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        }),
        prisma.case.findMany({
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        }),
      ])
      return { articles, cases }
    },
    ['admin', 'dashboard', 'recent', 'content'],
    {
      tags: [CacheTags.ADMIN, CacheTags.ARTICLES, CacheTags.CASES],
      revalidate: 120, // 2 minutes
    }
  )

  // Cache pending counts (1 minute revalidate)
  const getCachedPendingCounts = cache(
    async () => {
      // Fetch pending content reviews
      const pendingContentCount = await Promise.all([
        prisma.article.count({ where: { status: 'in_review' } }),
        prisma.case.count({ where: { status: 'in_review' } }),
      ]).then(([articles, cases]) => articles + cases)

      return { pendingContentCount }
    },
    ['admin', 'dashboard', 'pending'],
    {
      tags: [CacheTags.ADMIN, CacheTags.ARTICLES, CacheTags.CASES],
      revalidate: 60, // 1 minute
    }
  )

  const [{ articleCount, caseCount, userCount, simulationCount }, { articles, cases }, { pendingContentCount }] = await Promise.all([
    getCachedStats(),
    getCachedRecentContent(),
    getCachedPendingCounts(),
  ])

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Content management and platform oversight</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
              <Link href="/admin/analytics">Analytics</Link>
            </Button>
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
              <Link href="/admin/content">Manage Content</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {pendingContentCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-sm font-medium text-amber-900 mb-2">Pending Actions</h3>
          <div className="flex gap-4 text-sm text-amber-800">
            {pendingContentCount > 0 && (
              <Link href="/admin/content" className="hover:underline">
                {pendingContentCount} content in review
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Statistics KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Link href="/admin/content" className="bg-white border border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Total Articles
          </div>
          <div className="text-3xl font-semibold text-gray-900">{articleCount}</div>
        </Link>
        <Link href="/admin/content" className="bg-white border border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Total Cases
          </div>
          <div className="text-3xl font-semibold text-gray-900">{caseCount}</div>
        </Link>
        <Link href="/admin/users" className="bg-white border border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Total Users
          </div>
          <div className="text-3xl font-semibold text-gray-900">{userCount}</div>
        </Link>
        <Link href="/admin/simulations" className="bg-white border border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Completed Simulations
          </div>
          <div className="text-3xl font-semibold text-gray-900">{simulationCount}</div>
        </Link>
      </div>

      {/* Recent Articles */}
      <div className="bg-white border border-gray-200 mb-12">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Articles</h2>
          <p className="text-xs text-gray-500 mt-1">Latest articles in the competency library</p>
        </div>
        <div className="divide-y divide-gray-100">
          {articles.length > 0 ? (
            articles.map((article) => (
              <div key={article.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="text-base font-medium text-gray-900">{article.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{article.competency.name}</p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-medium text-gray-700 border-gray-300"
                >
                  {article.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">No articles found</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Cases */}
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Cases</h2>
          <p className="text-xs text-gray-500 mt-1">Latest case simulations</p>
        </div>
        <div className="divide-y divide-gray-100">
          {cases.length > 0 ? (
            cases.map((caseItem) => (
              <div key={caseItem.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="text-base font-medium text-gray-900">{caseItem.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(caseItem.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-medium text-gray-700 border-gray-300"
                >
                  {caseItem.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">No cases found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
