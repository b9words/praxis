'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'


interface Competency {
  id: string
  name: string
  level?: string
  parentId?: string | null
  children?: Competency[]
  articleCount?: number
  caseCount?: number
}

interface AdminTreeProps {
  competencies?: Competency[]
  articles: Array<{ id: string; competency?: { name: string } }>
  cases: Array<{ id: string; metadata?: { competencyName?: string; competencies?: string[] } }>
  selectedArena?: string
  selectedCompetency?: string
  onSelect: (type: 'arena' | 'competency', id: string | null) => void
}

export default function AdminTree({
  competencies = [],
  articles,
  cases,
  selectedArena,
  selectedCompetency,
  onSelect,
}: AdminTreeProps) {
  const [expandedCompetencies, setExpandedCompetencies] = useState<Set<string>>(new Set())

  // Build competency counts from articles and cases
  const competencyCounts = useMemo(() => {
    const counts: Record<string, { articles: number; cases: number }> = {}

    articles.forEach((article) => {
      const compName = article.competency?.name
      if (compName) {
        if (!counts[compName]) counts[compName] = { articles: 0, cases: 0 }
        counts[compName].articles++
      }
    })

    cases.forEach((caseItem) => {
      const compNames = [
        caseItem.metadata?.competencyName,
        ...(caseItem.metadata?.competencies || []),
      ].filter(Boolean) as string[]

      compNames.forEach((compName) => {
        if (!counts[compName]) counts[compName] = { articles: 0, cases: 0 }
        counts[compName].cases++
      })
    })

    return counts
  }, [articles, cases])

  // Build DB competency tree (arenas removed for performance)
  const dbCompetencyTree = useMemo(() => {

    const buildTree = (comps: Competency[], parentId: string | null = null): Competency[] => {
      return comps
        .filter((c) => c.parentId === parentId)
        .map((comp) => ({
          ...comp,
          articleCount: competencyCounts[comp.name]?.articles || 0,
          caseCount: competencyCounts[comp.name]?.cases || 0,
          children: buildTree(comps, comp.id),
        }))
    }

    return buildTree(competencies)
  }, [competencies, competencyCounts])

  const toggleCompetency = (compId: string) => {
    const newExpanded = new Set(expandedCompetencies)
    if (newExpanded.has(compId)) {
      newExpanded.delete(compId)
    } else {
      newExpanded.add(compId)
    }
    setExpandedCompetencies(newExpanded)
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-3 border-b sticky top-0 bg-white z-10">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Browse
        </div>
      </div>

      <div className="p-2 space-y-1">
        {/* All Content */}
        <button
          onClick={() => onSelect('arena', null)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-gray-100 transition-colors text-left',
            !selectedArena && !selectedCompetency && 'bg-blue-50 text-blue-700 font-medium'
          )}
        >
          <span>All Content</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {articles.length + cases.length}
          </Badge>
        </button>

        {/* DB Competency tree */}
        {dbCompetencyTree && dbCompetencyTree.length > 0 && (
          <div className="space-y-1 mt-2">
            {dbCompetencyTree.map((comp) => {
              const isExpanded = expandedCompetencies.has(comp.id)
              const isSelected = selectedCompetency === comp.id
              const totalCount = (comp.articleCount || 0) + (comp.caseCount || 0)

              return (
                <div key={comp.id} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (comp.children && comp.children.length > 0) {
                          toggleCompetency(comp.id)
                        } else {
                          onSelect('competency', comp.id)
                        }
                      }}
                      className={cn(
                        'flex-1 flex items-center gap-1.5 px-2 py-1 rounded text-sm hover:bg-gray-100 transition-colors',
                        isSelected && 'bg-blue-50 text-blue-700 font-medium'
                      )}
                    >
                      {comp.children && comp.children.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown className="h-3 w-3 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 flex-shrink-0" />
                        )
                      ) : (
                        <span className="w-3" />
                      )}
                      <span className="truncate flex-1">{comp.name}</span>
                      {totalCount > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {totalCount}
                        </Badge>
                      )}
                    </button>
                  </div>

                  {isExpanded && comp.children && comp.children.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {comp.children.map((child) => {
                        const childTotalCount = (child.articleCount || 0) + (child.caseCount || 0)
                        return (
                          <button
                            key={child.id}
                            onClick={() => onSelect('competency', child.id)}
                            className={cn(
                              'w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-gray-50 transition-colors',
                              selectedCompetency === child.id && 'bg-blue-50 text-blue-700 font-medium'
                            )}
                          >
                            <span className="truncate flex-1">{child.name}</span>
                            {childTotalCount > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                {childTotalCount}
                              </Badge>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {(!dbCompetencyTree || dbCompetencyTree.length === 0) && (
          <div className="text-xs text-muted-foreground p-4 text-center">
            No competencies available
          </div>
        )}
      </div>
    </div>
  )
}

