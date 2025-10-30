'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BookOpen, TrendingUp } from 'lucide-react'

interface LibraryProgressProps {
  completed: number
  total: number
  percentage: number
}

export default function LibraryProgress({ completed, total, percentage }: LibraryProgressProps) {
  if (total === 0) return null

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">Your Progress</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">{percentage}%</div>
            <div className="text-sm text-blue-700">{completed} of {total}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Progress value={percentage} className="h-3 bg-blue-200" />
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <BookOpen className="h-4 w-4" />
            <span>Articles completed in this section</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
