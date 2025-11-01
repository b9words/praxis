import { Button } from '@/components/ui/button'
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
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Application Review</h1>
        <p className="text-sm text-gray-600">Review and manage user applications to join Praxis Platform</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pending</div>
              <div className="text-3xl font-semibold text-gray-900">{statusCounts.pending}</div>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Approved</div>
              <div className="text-3xl font-semibold text-gray-900">{statusCounts.approved}</div>
            </div>
            <CheckCircle2 className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Rejected</div>
              <div className="text-3xl font-semibold text-gray-900">{statusCounts.rejected}</div>
            </div>
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-2">
          <Link href="/admin/applications">
            <Button
              variant={!statusFilter ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${!statusFilter ? 'border-gray-900 bg-gray-50' : 'border-transparent'}`}
            >
              All ({applications.length})
            </Button>
          </Link>
          <Link href="/admin/applications?status=pending">
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${statusFilter === 'pending' ? 'border-gray-900 bg-gray-50' : 'border-transparent'}`}
            >
              Pending ({statusCounts.pending})
            </Button>
          </Link>
          <Link href="/admin/applications?status=approved">
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${statusFilter === 'approved' ? 'border-gray-900 bg-gray-50' : 'border-transparent'}`}
            >
              Approved ({statusCounts.approved})
            </Button>
          </Link>
          <Link href="/admin/applications?status=rejected">
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${statusFilter === 'rejected' ? 'border-gray-900 bg-gray-50' : 'border-transparent'}`}
            >
              Rejected ({statusCounts.rejected})
            </Button>
          </Link>
        </div>
      </div>

      {/* Applications List */}
      <ApplicationsReview applications={applications} />
    </div>
  )
}

