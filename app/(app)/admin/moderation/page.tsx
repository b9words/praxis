import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import Link from 'next/link'

export default async function ModerationPage() {
  await requireRole('admin')

  const reports = await prisma.report.findMany({
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moderation Reports</h1>
          <p className="text-gray-600 mt-2">Review and manage user reports</p>
        </div>

        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No reports yet</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {report.reportedType === 'thread' ? 'Thread Report' : 'Post Report'}
                        <Badge
                          variant={
                            report.status === 'pending'
                              ? 'default'
                              : report.status === 'reviewed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {report.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Reported by {report.createdBy.fullName || report.createdBy.username}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{report.reason}</p>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
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
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

