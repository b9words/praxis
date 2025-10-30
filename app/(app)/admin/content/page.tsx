import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminContentPage() {
  try {
    await requireRole(['admin', 'editor'])
  } catch {
    redirect('/dashboard')
  }

  // Fetch articles grouped by status
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
  })

  // Fetch cases grouped by status
  const cases = await prisma.case.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  })

  const statusGroups = ['draft', 'in_review', 'approved', 'published']

  const groupArticlesByStatus = (status: string) => articles.filter((a) => a.status === status)

  const groupCasesByStatus = (status: string) => cases.filter((c) => c.status === status)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="mt-2 text-gray-600">Manage articles and case simulations</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/content/generate">🤖 Generate Curriculum</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/content/new?type=article">New Article</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/content/new?type=case">New Case</Link>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statusGroups.map((status) => (
          <div key={status} className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 capitalize flex items-center justify-between">
              {status.replace('_', ' ')}
              <Badge variant="outline">
                {groupArticlesByStatus(status).length + groupCasesByStatus(status).length}
              </Badge>
            </h2>

            <div className="space-y-2">
              {/* Articles */}
              {groupArticlesByStatus(status).map((article) => (
                <div key={article.id} className="space-y-2">
                  <Link href={`/admin/content/edit/${article.id}?type=article`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="secondary" className="text-xs mb-2">
                              Article
                            </Badge>
                            <CardTitle className="text-sm line-clamp-2">{article.title}</CardTitle>
                            <p className="text-xs text-gray-500 mt-1">{article.competency.name}</p>
                            {article.storagePath && (
                              <p className="text-xs text-blue-600 mt-1 font-mono">
                                {article.storagePath}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                  {article.storagePath && (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/admin/edit?path=${article.storagePath}&type=article`}>
                        Edit File in Storage
                      </Link>
                    </Button>
                  )}
                </div>
              ))}

              {/* Cases */}
              {groupCasesByStatus(status).map((caseItem) => (
                <div key={caseItem.id} className="space-y-2">
                  <Link href={`/admin/content/edit/${caseItem.id}?type=case`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="secondary" className="text-xs mb-2">
                              Case
                            </Badge>
                            <CardTitle className="text-sm line-clamp-2">{caseItem.title}</CardTitle>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(caseItem.updatedAt).toLocaleDateString()}
                            </p>
                            {caseItem.storagePath && (
                              <p className="text-xs text-blue-600 mt-1 font-mono">
                                {caseItem.storagePath}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                  {caseItem.storagePath && (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/admin/edit?path=${caseItem.storagePath}&type=case`}>
                        Edit File in Storage
                      </Link>
                    </Button>
                  )}
                </div>
              ))}

              {groupArticlesByStatus(status).length === 0 &&
                groupCasesByStatus(status).length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center text-sm text-gray-400">
                      No content
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
