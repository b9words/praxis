import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { cache, CacheTags } from '@/lib/cache'
import Link from 'next/link'

export default async function ModerationPage() {
  // Cache reports list (1 minute revalidate)
  const getCachedReports = cache(
    async () => {
      // Wrap with error handling for missing tables (P2021)
      let reports: any[] = []
      try {
        reports = await (prisma as any).report.findMany({
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
      } catch (error: any) {
        if (isMissingTable(error)) {
          reports = []
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('[admin/moderation] Error fetching reports:', error)
          }
          reports = []
        }
      }
      
      return reports
    },
    ['admin', 'moderation', 'reports'],
    {
      tags: [CacheTags.ADMIN],
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
            {reports.map((report: any) => (
              <div key={report.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-medium text-gray-900">
                        Content Report
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs font-medium text-gray-700 border-gray-300"
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Reported by {report.createdBy?.fullName || report.createdBy?.username || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">{report.reason}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        Report ID: {report.reportedId}
                      </span>
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
