import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import { BookOpen, Target, TrendingUp } from 'lucide-react'
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={TrendingUp}
            title="No activity yet"
            description="Start reading articles and completing simulations to track your learning progress here."
            action={{
              label: "Browse Library",
              href: "/library"
            }}
            className="border-0 shadow-none"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={
                activity.type === 'article'
                  ? `/library/${activity.id}`
                  : `/simulations/${activity.id}/brief`
              }
              className="block"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div
                  className={`mt-0.5 p-2 rounded-lg ${
                    activity.type === 'article'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
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
                      <Badge variant="secondary" className="text-xs">
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
      </CardContent>
    </Card>
  )
}

