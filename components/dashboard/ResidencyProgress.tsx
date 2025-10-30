'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {residency.title}
            </CardTitle>
            <CardDescription>Your current learning path</CardDescription>
          </div>
          <Badge className="bg-blue-600">Year {residency.year}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-semibold text-blue-600">{overallProgress.toFixed(0)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Articles</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">
                {residency.articlesCompleted} / {residency.totalArticles}
              </span>
            </div>
            <Progress value={articleProgress} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Simulations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">
                {residency.simulationsCompleted} / {residency.totalSimulations}
              </span>
            </div>
            <Progress value={simulationProgress} className="h-2" />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-blue-200">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/residency">
              Change Path
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

