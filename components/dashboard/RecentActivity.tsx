import { Badge } from '@/components/ui/badge'
import { BookOpen, Target } from 'lucide-react'
import Link from 'next/link'

interface Activity {
  id: string
  type: 'article' | 'simulation'
  title: string
  completedAt: string
  competency?: string
}

interface RecentActivityProps {
  activities: Activity[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">Recent Activity</h3>
        <div className="text-center py-8">
          <p className="text-sm font-medium text-gray-900 mb-2">No activity yet</p>
          <p className="text-xs text-gray-500">Start reading articles and completing simulations to track your learning progress here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={
              activity.type === 'article'
                ? `/library/${activity.id}`
                : `/simulations/${activity.id}/brief`
            }
            className="block hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3 p-4">
              <div className="mt-0.5 p-2 bg-gray-100 text-gray-600">
                {activity.type === 'article' ? (
                  <BookOpen className="h-4 w-4" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {activity.competency && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                      {activity.competency}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(activity.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

