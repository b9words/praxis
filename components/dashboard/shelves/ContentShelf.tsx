'use client'

import { ReactNode, useRef, Children, isValidElement } from 'react'
import Link from 'next/link'

interface ContentShelfProps {
  title: string
  subtitle?: string
  children: ReactNode
  viewAllHref?: string
  isLoading?: boolean
  emptyMessage?: string
}

export default function ContentShelf({
  title,
  subtitle,
  children,
  viewAllHref,
  isLoading = false,
  emptyMessage,
}: ContentShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Count valid children (non-null, non-undefined)
  const validChildren = Children.toArray(children).filter(child => 
    child !== null && child !== undefined && (isValidElement(child) || typeof child === 'string')
  )
  const hasContent = validChildren.length > 0

  // Handle keyboard navigation for horizontal scrolling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = 300

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Always render if emptyMessage is provided (for catalog browsing)
  const shouldRender = isLoading || hasContent || !!emptyMessage
  
  // Don't render if no content, not loading, and no empty message
  if (!shouldRender) {
    return null
  }

  return (
    <div className="mb-12">
      <div className="flex items-baseline justify-between mb-6">
        <div className="relative">
          <h2 className="text-xl font-medium text-gray-900 mb-1.5 tracking-tight" id={`shelf-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl" id={`shelf-${title.toLowerCase().replace(/\s+/g, '-')}-subtitle`}>
              {subtitle}
            </p>
          )}
          {/* Subtle editorial line accent */}
          <div className="absolute -left-4 top-0 w-px h-12 bg-gray-300 opacity-30 hidden lg:block" aria-hidden="true"></div>
        </div>
        {viewAllHref && hasContent && (
          <Link
            href={viewAllHref}
            className="text-xs text-gray-500 hover:text-gray-900 font-medium tracking-wide uppercase hidden sm:inline-flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
            aria-label={`View all items in ${title}`}
          >
            Show all
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
      <div className="relative">
        {isLoading ? (
          <div className="flex gap-3 -mx-6 px-6 pb-3" aria-label={`Loading ${title}`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[180px] h-[240px] bg-gray-100 rounded-lg animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : !hasContent ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center" role="status" aria-live="polite">
            <p className="text-sm text-gray-600">{emptyMessage || 'No items available at this time.'}</p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto -mx-6 px-6 scrollbar-hide scroll-smooth focus-within:outline-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role="region"
            aria-label={title}
            aria-describedby={subtitle ? `shelf-${title.toLowerCase().replace(/\s+/g, '-')}-subtitle` : undefined}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div className="flex gap-3 min-w-max pb-3" role="list">
              {Children.map(children, (child, index) => {
                if (!child || (isValidElement(child) && child.type === null)) {
                  return null
                }
                return (
                  <div key={index} className="flex-shrink-0" role="listitem">
                    {child}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
