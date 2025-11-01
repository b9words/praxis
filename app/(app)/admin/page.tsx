import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  try {
    await requireRole(['admin', 'editor'])
  } catch {
    redirect('/dashboard')
  }

  // Fetch content statistics
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

  // Fetch articles by status
  const articles = await prisma.article.findMany({
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
  })

  // Fetch cases by status
  const cases = await prisma.case.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10,
  })

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

      {/* Statistics KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Total Articles
          </div>
          <div className="text-3xl font-semibold text-gray-900">{articleCount}</div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Total Cases
          </div>
          <div className="text-3xl font-semibold text-gray-900">{caseCount}</div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Total Users
          </div>
          <div className="text-3xl font-semibold text-gray-900">{userCount}</div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Completed Simulations
          </div>
          <div className="text-3xl font-semibold text-gray-900">{simulationCount}</div>
        </div>
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
