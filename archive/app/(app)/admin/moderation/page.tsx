import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma/server'
import { safeFindMany } from '@/lib/prisma-safe'
import { isMissingTable } from '@/lib/api/route-helpers'
import { cache, CacheTags } from '@/lib/cache'
import Link from 'next/link'

export default async function ModerationPage() {
  // Cache reports list (1 minute revalidate)
  const getCachedReports = cache(
    async () => {
      // Wrap with error handling for missing tables (P2021)
      const result = await safeFindMany('report', {}, {
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      })
      
      // safeFindMany returns { data, error } and handles P2021 errors with fallback to []
      const reports = result.data ?? []
      
      // Log errors in dev mode if they're not missing table errors
      if (process.env.NODE_ENV === 'development' && result.error && !isMissingTable(result.error)) {
        console.error('[admin/moderation] Error fetching reports:', result.error)
      }
      
      return reports
    },
    ['admin', 'moderation', 'reports'],
    {
      tags: [CacheTags.ADMIN, CacheTags.MODERATION],
      revalidate: 60, // 1 minute (frequent updates)
    }
  )
  
  const reports = await getCachedReports()

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Moderation Reports</h1>
        <p className="text-sm text-gray-600">Review and manage user reports</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">No reports yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200">
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-medium text-gray-900">
                        {report.reportedType === 'thread' ? 'Thread Report' : 'Post Report'}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs font-medium text-gray-700 border-gray-300"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Reported by {report.createdBy.fullName || report.createdBy.username}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">{report.reason}</p>
                    <div className="flex items-center gap-3">
                      <Button asChild variant="outline" size="sm" className="border-gray-300 hover:border-gray-400 rounded-none">
                        <Link
                          href={
                            report.reportedType === 'thread'
                              ? `/community/thread/${report.reportedId}`
                              : `/community/post/${report.reportedId}`
                          }
                        >
                          View {report.reportedType === 'thread' ? 'Thread' : 'Post'}
                        </Link>
                      </Button>
                      <span className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
