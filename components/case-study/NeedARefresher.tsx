'use client'

import { BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Competency {
  id: string
  name: string
}

interface Lesson {
  domain: string
  module: string
  lesson: string
  url: string
  title: string
}

interface NeedARefresherProps {
  competencies: Competency[]
  caseId: string
  recommendedLessons?: Lesson[]
}

export default function NeedARefresher({ competencies, caseId, recommendedLessons = [] }: NeedARefresherProps) {

  if (recommendedLessons.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4 text-neutral-600" />
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
          Need a Refresher?
        </h3>
      </div>
      <p className="text-xs text-neutral-600 mb-3">
        Review these foundational lessons to strengthen your understanding before proceeding.
      </p>
      <div className="space-y-2">
        {recommendedLessons.slice(0, 5).map((lesson, idx) => {
          const lessonUrl = lesson.url || `/library/curriculum/${lesson.domain}/${lesson.module}/${lesson.lesson}`
          return (
            <Link
              key={`${lesson.domain}-${lesson.module}-${lesson.lesson}`}
              href={lessonUrl}
              className="flex items-center justify-between p-2 border border-neutral-200 rounded hover:border-neutral-300 hover:bg-neutral-50 transition-colors group"
            >
              <span className="text-xs text-neutral-700 group-hover:text-neutral-900 flex-1 truncate">
                {idx + 1}. {lesson.title}
              </span>
              <ArrowRight className="h-3 w-3 text-neutral-400 group-hover:text-neutral-600 ml-2 flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

