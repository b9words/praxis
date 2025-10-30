import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Content management and platform oversight</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/analytics">📊 Analytics</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/content">Manage Content</Link>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{articleCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{caseCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{simulationCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Articles</CardTitle>
          <CardDescription>Latest articles in the competency library</CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map((article) => (
                <div key={article.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium text-gray-900">{article.title}</h4>
                    <p className="text-sm text-gray-600">{article.competency.name}</p>
                  </div>
                  <Badge
                    variant={
                      article.status === 'published'
                        ? 'default'
                        : article.status === 'approved'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {article.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No articles found</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Cases</CardTitle>
          <CardDescription>Latest case simulations</CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length > 0 ? (
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium text-gray-900">{caseItem.title}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(caseItem.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      caseItem.status === 'published'
                        ? 'default'
                        : caseItem.status === 'approved'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {caseItem.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No cases found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
