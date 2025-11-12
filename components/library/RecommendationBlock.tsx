'use client'

import { ArrowRight, BookOpen, Target } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Recommendation {
  id: string
  title: string
  url: string
  type: 'lesson' | 'case-study' | 'article'
  reason?: string
  domainTitle?: string
}

interface RecommendationBlockProps {
  recommendations: Recommendation[]
  title?: string
  maxItems?: number
}

export default function RecommendationBlock({
  recommendations,
  title = 'Recommended for you',
  maxItems = 3,
}: RecommendationBlockProps) {
  if (!recommendations || recommendations.length === 0) {
    return null
  }

  const displayItems = recommendations.slice(0, maxItems)

  const getIcon = (type: string) => {
    switch (type) {
      case 'case-study':
        return <Target className="h-3.5 w-3.5 text-neutral-500" />
      case 'article':
        return <BookOpen className="h-3.5 w-3.5 text-neutral-500" />
      default:
        return <BookOpen className="h-3.5 w-3.5 text-neutral-500" />
    }
  }

  return (
    <div className="border-l border-neutral-200 pl-4">
      <h3 className="text-xs font-medium text-neutral-900 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <div className="space-y-3">
        {displayItems.map((rec, index) => (
          <Link
            key={rec.id}
            href={rec.url}
            className="block group hover:bg-neutral-50 p-2 -m-2 rounded transition-colors"
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex-shrink-0">
                {getIcon(rec.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 leading-snug mb-1">
                  {rec.title}
                </p>
                {rec.reason && (
                  <p className="text-xs text-neutral-600 leading-snug">
                    {rec.reason}
                  </p>
                )}
                {rec.domainTitle && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {rec.domainTitle}
                  </p>
                )}
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600 flex-shrink-0 mt-0.5 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

