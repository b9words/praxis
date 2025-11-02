import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'
import CompetenciesManagement from '@/components/admin/CompetenciesManagement'
import { cache, CacheTags } from '@/lib/cache'

export default async function AdminCompetenciesPage() {
  // Cache competencies list (15 minutes revalidate)
  const getCachedCompetencies = cache(
    async () => {
      const competencies = await prisma.competency.findMany({
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          articles: {
            select: {
              id: true,
            },
          },
        },
        orderBy: [
          { level: 'asc' },
          { displayOrder: 'asc' },
          { name: 'asc' },
        ],
      })
      return competencies
    },
    ['admin', 'competencies', 'all'],
    {
      tags: [CacheTags.ADMIN, CacheTags.COMPETENCIES],
      revalidate: 900, // 15 minutes
    }
  )

  const competencies = await getCachedCompetencies()

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <CompetenciesManagement initialCompetencies={competencies} />
    </div>
  )
}

