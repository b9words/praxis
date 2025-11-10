'use client'

import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'

interface BreadcrumbNode {
  id: string
  name: string
  level: string
  residency_year?: number
}

function LibraryBreadcrumbsContent() {
  const searchParams = useSearchParams()
  const competencyId = searchParams.get('competency')

  // Fetch all competencies with React Query
  const { data: competenciesData } = useQuery({
    queryKey: queryKeys.competencies.all(),
    queryFn: ({ signal }) => fetchJson<{ competencies: any[] }>('/api/competencies', { signal }),
    enabled: !!competencyId,
  })

  // Build breadcrumbs path from competencyId to root
  const breadcrumbs = useMemo(() => {
    if (!competencyId || !competenciesData?.competencies) {
      return []
    }

    const compMap = new Map(competenciesData.competencies.map((c) => [c.id, c]))
    const path: BreadcrumbNode[] = []
    let currentId: string | null = competencyId

    while (currentId) {
      const comp = compMap.get(currentId)
      if (!comp) break

      path.unshift({
        id: comp.id,
        name: comp.name,
        level: comp.level,
        residency_year: comp.residencyYear,
      })

      currentId = comp.parentId
    }

    return path
  }, [competencyId, competenciesData])

  if (breadcrumbs.length === 0) {
    return null
  }

  const residencyYear = breadcrumbs[0]?.residency_year

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link href="/library" className="hover:text-gray-900 transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      
      {residencyYear && (
        <>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/library?year=${residencyYear}`}
            className="hover:text-gray-900 transition-colors"
          >
            Year {residencyYear}
          </Link>
        </>
      )}

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/library?competency=${crumb.id}`}
            className={`
              hover:text-gray-900 transition-colors
              ${index === breadcrumbs.length - 1 ? 'font-semibold text-gray-900' : ''}
            `}
          >
            {crumb.name}
          </Link>
        </div>
      ))}
    </nav>
  )
}

export default function LibraryBreadcrumbs() {
  return (
    <Suspense fallback={null}>
      <LibraryBreadcrumbsContent />
    </Suspense>
  )
}

