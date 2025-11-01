'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BookOpen, CheckCircle2, Target } from 'lucide-react'
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
}

export default function ResidencyProgress({ residency }: ResidencyProgressProps) {
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

