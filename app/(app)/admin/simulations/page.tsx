import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'
import SimulationsManagement from '@/components/admin/SimulationsManagement'
import { cache, CacheTags } from '@/lib/cache'

export default async function AdminSimulationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    userId?: string
    caseId?: string
    status?: string
    page?: string
  }>
}) {

  const params = await searchParams
  const userId = params.userId || '__all__'
  const caseId = params.caseId || '__all__'
  const status = params.status || '__all__'
  const page = parseInt(params.page || '1')
  const perPage = 20

  // Cache simulations list queries (2 minutes revalidate)
  const getCachedSimulations = cache(
    async () => {
      const where: any = {}
      if (userId && userId !== '__all__') where.userId = userId
      if (caseId && caseId !== '__all__') where.caseId = caseId
      if (status && status !== '__all__') where.status = status

      const [simulations, total] = await Promise.all([
        prisma.simulation.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
            case: {
              select: {
                id: true,
                title: true,
              },
            },
            debrief: {
              select: {
                id: true,
                scores: true,
                summaryText: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.simulation.count({ where }),
      ])
      return { simulations, total }
    },
    ['admin', 'simulations', userId, caseId, status, page.toString()],
    {
      tags: [CacheTags.ADMIN, CacheTags.SIMULATIONS],
      revalidate: 120, // 2 minutes
    }
  )

  // Cache users and cases for filters (longer cache - 15 minutes)
  const getCachedFilters = cache(
    async () => {
      const [users, cases] = await Promise.all([
        prisma.profile.findMany({
          select: { id: true, username: true, fullName: true },
          orderBy: { username: 'asc' },
        }),
        prisma.case.findMany({
          select: { id: true, title: true },
          orderBy: { title: 'asc' },
        }),
      ])
      return { users, cases }
    },
    ['admin', 'simulations', 'filters'],
    {
      tags: [CacheTags.ADMIN, CacheTags.USERS, CacheTags.CASES],
      revalidate: 900, // 15 minutes
    }
  )

  const [{ simulations, total }, { users, cases }] = await Promise.all([
    getCachedSimulations(),
    getCachedFilters(),
  ])

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <SimulationsManagement
        initialSimulations={simulations}
        totalSimulations={total}
        currentPage={page}
        perPage={perPage}
        users={users}
        cases={cases}
        initialFilters={{ userId, caseId, status }}
      />
    </div>
  )
}

