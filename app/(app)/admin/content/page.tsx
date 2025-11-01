import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Content Management</h1>
            <p className="text-sm text-gray-600">Manage articles and case simulations</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
              <Link href="/admin/content/generate">Generate Curriculum</Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
              <Link href="/admin/content/new?type=article">New Article</Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
              <Link href="/admin/content/new?type=case">New Case</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusGroups.map((status) => (
          <div key={status} className="space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-900 capitalize">
                  {status.replace('_', ' ')}
                </h2>
                <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                  {groupArticlesByStatus(status).length + groupCasesByStatus(status).length}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {/* Articles */}
              {groupArticlesByStatus(status).map((article) => (
                <div key={article.id} className="space-y-2">
                  <Link href={`/admin/content/edit/${article.id}?type=article`}>
                    <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs font-medium text-gray-600 border-gray-300 mb-2">
                            Article
                          </Badge>
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{article.title}</h3>
                          <p className="text-xs text-gray-500">{article.competency.name}</p>
                          {article.storagePath && (
                            <p className="text-xs text-gray-400 mt-1 font-mono">
                              {article.storagePath}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  {article.storagePath && (
                    <Button asChild variant="outline" size="sm" className="w-full border-gray-300 rounded-none text-xs">
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
                    <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs font-medium text-gray-600 border-gray-300 mb-2">
                            Case
                          </Badge>
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{caseItem.title}</h3>
                          <p className="text-xs text-gray-500">
                            {new Date(caseItem.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {caseItem.storagePath && (
                            <p className="text-xs text-gray-400 mt-1 font-mono">
                              {caseItem.storagePath}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  {caseItem.storagePath && (
                    <Button asChild variant="outline" size="sm" className="w-full border-gray-300 rounded-none text-xs">
                      <Link href={`/admin/edit?path=${caseItem.storagePath}&type=case`}>
                        Edit File in Storage
                      </Link>
                    </Button>
                  )}
                </div>
              ))}

              {groupArticlesByStatus(status).length === 0 &&
                groupCasesByStatus(status).length === 0 && (
                  <div className="bg-white border border-dashed border-gray-200 p-8 text-center">
                    <p className="text-xs text-gray-400">No content</p>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
