'use client'

import { createClient } from '@/lib/supabase/client'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface BreadcrumbNode {
  id: string
  name: string
  level: string
  residency_year?: number
}

export default function LibraryBreadcrumbs() {
  const searchParams = useSearchParams()
  const competencyId = searchParams.get('competency')
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbNode[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchBreadcrumbs() {
      if (!competencyId) {
        setBreadcrumbs([])
        return
      }

      const { data: competencies } = await supabase
        .from('competencies')
        .select('id, name, level, parent_id, residency_year')

      if (!competencies) return

      // Build path from selected competency to root
      const path: BreadcrumbNode[] = []
      let currentId = competencyId
      const compMap = new Map(competencies.map((c) => [c.id, c]))

      while (currentId) {
        const comp = compMap.get(currentId)
        if (!comp) break

        path.unshift({
          id: comp.id,
          name: comp.name,
          level: comp.level,
          residency_year: comp.residency_year,
        })

        currentId = comp.parent_id
      }

      setBreadcrumbs(path)
    }

    fetchBreadcrumbs()
  }, [competencyId, supabase])

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

