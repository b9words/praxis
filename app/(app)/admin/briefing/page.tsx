import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
import { getDomainById, getModuleById, getAllDomains } from '@/lib/curriculum-data'
import BriefingScheduleManager from '@/components/admin/BriefingScheduleManager'

export default async function AdminBriefingPage() {
  await requireRole('admin')

  // Cache briefing schedule list (2 minutes revalidate)
  const getCachedSchedules = cache(
    async () => {
      return await prisma.briefingSchedule.findMany({
        orderBy: {
          weekOf: 'desc',
        },
      })
    },
    ['admin', 'briefing', 'schedules'],
    {
      tags: [CacheTags.ADMIN],
      revalidate: 120, // 2 minutes
    }
  )

  const schedules = await getCachedSchedules()

  // Get all cases for dropdown
  const cases = await prisma.case.findMany({
    select: {
      id: true,
      title: true,
      status: true,
    },
    orderBy: {
      title: 'asc',
    },
  })

  // Get all domains for dropdown
  const domains = getAllDomains()

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Briefing Schedule Management</h1>
        <p className="text-sm text-gray-600">
          Manage the weekly Intelligence Briefing schedule. Each week, one module and case study are made publicly accessible.
        </p>
      </div>

      <BriefingScheduleManager
        schedules={schedules.map((s) => ({
          id: s.id,
          weekOf: s.weekOf.toISOString().slice(0, 10),
          domainId: s.domainId,
          moduleId: s.moduleId,
          caseId: s.caseId,
        }))}
        domains={domains.map((d) => ({
          id: d.id,
          title: d.title,
        }))}
        cases={cases}
      />
    </div>
  )
}






