'use client'

import Link from 'next/link'
import { trackEvents } from '@/lib/analytics'

interface LessonCardProps {
  id: string
  title: string
  url: string
  moduleTitle?: string
  timeSpent?: number
  progress?: number
  domainTitle?: string
  shelfName?: string
}

// OPTION 1: Abstract SVG Pattern - Typographic lines
const TypographyPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none" viewBox="0 0 180 140">
    <defs>
      <pattern id="lines" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0 10 L20 10" stroke="currentColor" strokeWidth="0.5" />
        <path d="M0 15 L15 15" stroke="currentColor" strokeWidth="0.5" />
        <path d="M0 5 L18 5" stroke="currentColor" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#lines)" />
    {/* Decorative curves */}
    <path d="M20 20 Q90 60, 160 20" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
    <path d="M20 120 Q90 80, 160 120" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
  </svg>
)

export default function LessonCard({
  id,
  title,
  url,
  moduleTitle,
  progress,
  shelfName,
}: LessonCardProps) {
  const handleClick = () => {
    trackEvents.dashboardCardClicked('lesson', id, shelfName)
  }

  const isComplete = progress === 100

  if (!url) {
    return null
  }

  return (
    <Link href={url} className="block group min-w-[180px] w-[180px]" onClick={handleClick}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-400 hover:shadow-lg transition-all duration-300 relative">
        {/* Header - Typography-inspired design */}
        <div className="relative bg-white h-[140px] overflow-hidden">
          {/* SVG Pattern */}
          <TypographyPattern />
          
          {/* Central element - simple geometric shape */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Shadow effect */}
              <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-gray-200 rounded" />
              <div className={`relative w-16 h-16 bg-white border-2 ${isComplete ? 'border-gray-400' : 'border-gray-300'} rounded shadow-sm group-hover:shadow-md transition-all`}>
              </div>
            </div>
          </div>

          {/* Page corner fold */}
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] border-t-gray-100 group-hover:border-t-gray-200 transition-colors" />
          
          {/* Progress indicator - vertical lines on left */}
          {progress !== undefined && progress > 0 && progress < 100 && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-100">
              <div
                className="absolute bottom-0 left-0 w-full bg-gray-900 transition-all"
                style={{ height: `${progress}%` }}
              />
            </div>
          )}
          
          {/* Completion indicator */}
          {isComplete && (
            <div className="absolute top-2 right-2">
              <div className="w-7 h-7 bg-gray-900 rounded-full shadow-md">
              </div>
            </div>
          )}
        </div>

        {/* Content section - minimal, editorial */}
        <div className="px-3.5 py-3 border-t border-gray-200 bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          {moduleTitle && (
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide line-clamp-1 mt-0.5" title={moduleTitle}>
              {moduleTitle}
            </p>
          )}
          {progress !== undefined && progress > 0 && progress < 100 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex-1 h-0.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400 font-mono tabular-nums">{progress}%</span>
            </div>
          )}
        </div>

        {/* Top edge accent - appears on hover */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-900 opacity-0 group-hover:opacity-20 transition-opacity" />
      </div>
    </Link>
  )
}
