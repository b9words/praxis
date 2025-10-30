import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ApplicationsReview from './ApplicationsReview'

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  try {
    await requireRole(['admin', 'editor'])
  } catch {
    redirect('/dashboard')
  }

  const params = await searchParams
  const statusFilter = params.status as 'pending' | 'approved' | 'rejected' | undefined

  const where = statusFilter ? { status: statusFilter } : {}

  const [applications, stats] = await Promise.all([
    prisma.userApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.userApplication.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    }),
  ])

  const statusCounts = {
    pending: stats.find((s) => s.status === 'pending')?._count.id || 0,
    approved: stats.find((s) => s.status === 'approved')?._count.id || 0,
    rejected: stats.find((s) => s.status === 'rejected')?._count.id || 0,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Application Review</h1>
        <p className="text-gray-600 mt-2">
          Review and manage user applications to join Praxis Platform
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold mt-1">{statusCounts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold mt-1">{statusCounts.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold mt-1">{statusCounts.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <Link href="/admin/applications">
          <Button
            variant={!statusFilter ? 'default' : 'ghost'}
            className="rounded-b-none"
          >
            All ({applications.length})
          </Button>
        </Link>
        <Link href="/admin/applications?status=pending">
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'ghost'}
            className="rounded-b-none"
          >
            Pending ({statusCounts.pending})
          </Button>
        </Link>
        <Link href="/admin/applications?status=approved">
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'ghost'}
            className="rounded-b-none"
          >
            Approved ({statusCounts.approved})
          </Button>
        </Link>
        <Link href="/admin/applications?status=rejected">
          <Button
            variant={statusFilter === 'rejected' ? 'default' : 'ghost'}
            className="rounded-b-none"
          >
            Rejected ({statusCounts.rejected})
          </Button>
        </Link>
      </div>

      {/* Applications List */}
      <ApplicationsReview applications={applications} />
    </div>
  )
}

