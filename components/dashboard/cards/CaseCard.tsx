'use client'

import Link from 'next/link'
import { trackEvents } from '@/lib/analytics'

interface CaseCardProps {
  id: string
  title: string
  url: string
  company?: string
  shelfName?: string
}

// OPTION 2: Concentric Circles SVG - Target/Arena theme
const TargetPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="none" viewBox="0 0 180 140">
    {/* Concentric circles */}
    <circle cx="90" cy="70" r="50" stroke="currentColor" strokeWidth="1" fill="none" />
    <circle cx="90" cy="70" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="90" cy="70" r="20" stroke="currentColor" strokeWidth="0.5" fill="none" />
    <circle cx="90" cy="70" r="5" fill="currentColor" />
    {/* Intersecting lines */}
    <line x1="90" y1="0" x2="90" y2="140" stroke="currentColor" strokeWidth="0.5" />
    <line x1="0" y1="70" x2="180" y2="70" stroke="currentColor" strokeWidth="0.5" />
    {/* Diagonal lines */}
    <line x1="0" y1="0" x2="180" y2="140" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    <line x1="180" y1="0" x2="0" y2="140" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
  </svg>
)

export default function CaseCard({
  id,
  title,
  url,
  company,
  shelfName,
}: CaseCardProps) {
  const handleClick = () => {
    trackEvents.dashboardCardClicked('case', id, shelfName)
  }

  if (!url) {
    return null
  }

  return (
    <Link href={url} className="block group min-w-[180px] w-[180px]" onClick={handleClick}>
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden hover:border-gray-500 hover:shadow-xl transition-all duration-300 relative">
        {/* Header - Target/Arena design */}
        <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 h-[140px] overflow-hidden">
          {/* SVG Pattern */}
          <TargetPattern />
          
          {/* Central element */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Outer ring animation on hover */}
              <div className="absolute inset-0 rounded-full border-2 border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity scale-125" />
              <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-400 shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all">
              </div>
            </div>
          </div>

          {/* Corner brackets - Arena framing */}
          <div className="absolute top-2 left-2 w-8 h-px bg-gray-400" />
          <div className="absolute top-2 left-2 w-px h-8 bg-gray-400" />
          <div className="absolute top-2 right-2 w-8 h-px bg-gray-400" />
          <div className="absolute top-2 right-2 w-px h-8 bg-gray-400" />
          <div className="absolute bottom-2 left-2 w-8 h-px bg-gray-400" />
          <div className="absolute bottom-2 left-2 w-px h-8 bg-gray-400" />
          <div className="absolute bottom-2 right-2 w-8 h-px bg-gray-400" />
          <div className="absolute bottom-2 right-2 w-px h-8 bg-gray-400" />

          {/* Play indicator - appears on hover */}
          <div className="absolute bottom-3 right-3 w-12 h-12 bg-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-xl">
          </div>
        </div>

        {/* Content section */}
        <div className="px-3.5 py-3 border-t-2 border-gray-200 bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          {company && (
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide line-clamp-1 mt-0.5">
              {company}
            </p>
          )}
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 opacity-0 group-hover:opacity-30 transition-opacity" />
      </div>
    </Link>
  )
}
