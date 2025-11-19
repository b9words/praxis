'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CompetencyScore {
  competencyName: string
  score: number
  justification?: string
  strength?: string
  weakness?: string
  actionableAdvice?: string
}

interface CompetencyTableProps {
  scores: CompetencyScore[]
  getLessonUrl: (competencyName: string) => string | null
  expandedByDefault?: boolean
}

export default function CompetencyTable({
  scores,
  getLessonUrl,
  expandedByDefault = false,
}: CompetencyTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    expandedByDefault ? new Set(scores.map(s => s.competencyName)) : new Set()
  )
  const [allExpanded, setAllExpanded] = useState(expandedByDefault)

  const toggleRow = (competencyName: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(competencyName)) {
      newExpanded.delete(competencyName)
    } else {
      newExpanded.add(competencyName)
    }
    setExpandedRows(newExpanded)
    setAllExpanded(newExpanded.size === scores.length)
  }

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedRows(new Set())
      setAllExpanded(false)
    } else {
      setExpandedRows(new Set(scores.map(s => s.competencyName)))
      setAllExpanded(true)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 3) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 2) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Strong'
    if (score >= 3) return 'Good'
    if (score >= 2) return 'Developing'
    return 'Needs Work'
  }

  return (
    <div className="space-y-4">
      {/* Header with Expand/Collapse All */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Competency Analysis</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>

      {/* Dense Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="divide-y divide-gray-200">
          {scores.map((score, index) => {
            const isExpanded = expandedRows.has(score.competencyName)
            const lessonUrl = getLessonUrl(score.competencyName)
            const strengthPreview = score.strength ? score.strength.substring(0, 80) + (score.strength.length > 80 ? '...' : '') : ''
            const weaknessPreview = score.weakness ? score.weakness.substring(0, 80) + (score.weakness.length > 80 ? '...' : '') : ''

            return (
              <div key={score.competencyName || index} className="transition-colors hover:bg-gray-50">
                {/* Compact Row */}
                <button
                  onClick={() => toggleRow(score.competencyName)}
                  className="w-full text-left p-4 flex items-center gap-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  aria-expanded={isExpanded}
                  aria-controls={`competency-${index}-details`}
                >
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-[2fr_1fr_2fr] gap-4 items-center">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {score.competencyName || 'Unknown Competency'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs font-medium border',
                          getScoreColor(score.score)
                        )}
                      >
                        {score.score.toFixed(1)}/5
                      </Badge>
                      <span className="text-xs text-gray-500">{getScoreLabel(score.score)}</span>
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {strengthPreview || weaknessPreview || 'No summary available'}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div
                    id={`competency-${index}-details`}
                    className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50"
                    role="region"
                    aria-labelledby={`competency-${index}-name`}
                  >
                    <div className="space-y-3 pt-3">
                      {score.strength && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <h4 className="text-xs font-medium text-green-900">Strength</h4>
                          </div>
                          <p className="text-xs text-green-800 leading-relaxed">{score.strength}</p>
                        </div>
                      )}
                      {score.weakness && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <h4 className="text-xs font-medium text-red-900">Area for Improvement</h4>
                          </div>
                          <p className="text-xs text-red-800 leading-relaxed">{score.weakness}</p>
                        </div>
                      )}
                      {score.actionableAdvice && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-xs font-medium text-blue-900 mb-1">Actionable Advice</h4>
                          <p className="text-xs text-blue-800 mb-2 leading-relaxed">{score.actionableAdvice}</p>
                          {lessonUrl && (
                            <Link href={lessonUrl}>
                              <Button variant="outline" size="sm" className="mt-2 h-7 text-xs rounded-none">
                                Review Lesson
                                <ArrowRight className="ml-1.5 h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


