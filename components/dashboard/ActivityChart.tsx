'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityData {
  day: string
  articlesRead: number
  simulationsCompleted: number
}

interface ActivityChartProps {
  data: ActivityData[]
}

export default function ActivityChart({ data }: ActivityChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => d.articlesRead + d.simulationsCompleted),
    1
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week's Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-2 h-32">
            {data.map((day, i) => {
              const total = day.articlesRead + day.simulationsCompleted
              const height = (total / maxValue) * 100

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative" style={{ height: '100%' }}>
                    <div
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${total} activities`}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{day.day}</span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-gray-200 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-500" />
              <span className="text-gray-600">Total activities</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

