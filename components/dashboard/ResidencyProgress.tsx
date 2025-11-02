'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { BookOpen, CheckCircle2, Target, Circle } from 'lucide-react'
import Link from 'next/link'

interface ResidencyProgressProps {
  residency: {
    year: number
    title: string
    articlesCompleted: number
    totalArticles: number
    simulationsCompleted: number
    totalSimulations: number
  }
  domainCompletions?: Array<{
    domainId: string
    domainTitle: string
    completed: boolean
    progress?: number
  }>
}

export default function ResidencyProgress({ residency, domainCompletions = [] }: ResidencyProgressProps) {
  const articleProgress = residency.totalArticles > 0
    ? (residency.articlesCompleted / residency.totalArticles) * 100
    : 0

  const simulationProgress = residency.totalSimulations > 0
    ? (residency.simulationsCompleted / residency.totalSimulations) * 100
    : 0

  const overallProgress = ((articleProgress + simulationProgress) / 2)

  return (
    <div className="bg-white border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-600" />
              {residency.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Your current learning path</p>
          </div>
          <Badge className="bg-gray-900 text-white border-0">Year {residency.year}</Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Overall Progress</span>
            <span className="text-sm font-semibold text-gray-900">{overallProgress.toFixed(0)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Domain Map */}
        {domainCompletions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Domains</span>
              <span className="text-xs text-gray-500">
                {domainCompletions.filter(d => d.completed).length} / {domainCompletions.length} completed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {domainCompletions.map((domain) => (
                <Link
                  key={domain.domainId}
                  href={`/library/curriculum/${domain.domainId}`}
                  className="group"
                >
                  <Card className={`p-3 transition-all hover:shadow-md ${
                    domain.completed 
                      ? 'bg-green-50 border-green-200' 
                      : domain.progress && domain.progress > 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {domain.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm font-medium truncate ${
                          domain.completed ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {domain.domainTitle}
                        </span>
                      </div>
                      {domain.progress !== undefined && domain.progress > 0 && !domain.completed && (
                        <span className="text-xs text-gray-600 ml-2 flex-shrink-0">
                          {domain.progress}%
                        </span>
                      )}
                    </div>
                    {domain.progress !== undefined && domain.progress > 0 && !domain.completed && (
                      <Progress value={domain.progress} className="h-1 mt-2" />
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Articles</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-700" />
              <span className="text-base font-semibold text-gray-900">
                {residency.articlesCompleted} / {residency.totalArticles}
              </span>
            </div>
            <Progress value={articleProgress} className="h-1.5" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Simulations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-700" />
              <span className="text-base font-semibold text-gray-900">
                {residency.simulationsCompleted} / {residency.totalSimulations}
              </span>
            </div>
            <Progress value={simulationProgress} className="h-1.5" />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-gray-200">
          <Button asChild variant="outline" size="sm" className="w-full rounded-none border-gray-300 hover:border-gray-400">
            <Link href="/residency">
              Change Path
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

