'use client'

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
    <div className="bg-white border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-sm font-medium text-gray-900">This Week's Activity</h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-end justify-between gap-2 h-32">
          {data.map((day, i) => {
            const total = day.articlesRead + day.simulationsCompleted
            const height = (total / maxValue) * 100

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative" style={{ height: '100%' }}>
                  <div
                    className="absolute bottom-0 w-full bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`${total} activities`}
                  />
                </div>
                <span className="text-xs text-gray-600">{day.day}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-gray-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-gray-900" />
            <span className="text-gray-600">Total activities</span>
          </div>
        </div>
      </div>
    </div>
  )
}

