'use client'

import Link from 'next/link'
import { LearningPath } from '@/lib/learning-paths'
import { Progress } from '@/components/ui/progress'
import { trackEvents } from '@/lib/analytics'

interface LearningPathCardProps {
  path: LearningPath & {
    progress?: {
      completed: number
      total: number
      percentage: number
    }
  }
}

export default function LearningPathCard({ path }: LearningPathCardProps) {
  const progress = path.progress
  const hasProgress = progress && progress.total > 0

  const handleClick = () => {
    trackEvents.dashboardCardClicked('learning_path', path.id, 'Curated Learning Paths')
  }

  return (
    <Link
      href={`/library/paths/${path.id}`}
      className="block group min-w-[280px]"
      onClick={handleClick}
    >
      <div className="bg-white border border-gray-200 hover:border-gray-300 transition-colors h-full p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 group-hover:text-gray-700 mb-1 break-words">
              {path.title}
            </h3>
            {path.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {path.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        {hasProgress && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span className="font-medium">
                {progress.completed} of {progress.total} completed
              </span>
              <span className="text-gray-500">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <span>{path.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            {hasProgress && progress.percentage === 100 && (
              <div className="w-4 h-4 rounded-full bg-green-600"></div>
            )}
            <span className="text-gray-400">
              {path.items.length} {path.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

