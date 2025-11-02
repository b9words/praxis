'use client'

import Link from 'next/link'
import { trackEvents } from '@/lib/analytics'

interface ContinueLearningCardProps {
  type: 'lesson' | 'simulation'
  title: string
  url: string
  progress?: number
  id?: string
}

// OPTION 3: Zigzag/Flow SVG - Continuity/Progress theme
const FlowPattern = ({ progress = 0 }: { progress: number }) => (
  <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none" viewBox="0 0 180 140">
    {/* Zigzag path */}
    <path 
      d={`M 0 70 L 30 50 L 60 70 L 90 50 L 120 70 L 150 50 L 180 70`}
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      strokeLinecap="round"
    />
    {/* Progress wave */}
    <path 
      d={`M 0 70 L 30 50 L 60 70 L 90 50 L 120 70 L 150 50 L 180 70`}
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
      strokeDasharray={180}
      strokeDashoffset={180 - (progress / 100 * 180)}
      opacity="0.6"
      strokeLinecap="round"
    />
    {/* Subtle grid */}
    <defs>
      <pattern id="flow-grid" x="0" y="0" width="30" height="20" patternUnits="userSpaceOnUse">
        <circle cx="15" cy="10" r="1" fill="currentColor" opacity="0.3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#flow-grid)" />
  </svg>
)

export default function ContinueLearningCard({
  type,
  title,
  url,
  progress,
  id,
}: ContinueLearningCardProps) {
  const handleClick = () => {
    if (id) {
      trackEvents.dashboardCardClicked(type === 'lesson' ? 'lesson' : 'case', id, 'Jump Back In')
    }
  }

  const displayProgress = progress ?? 0

  if (!url) {
    return null
  }

  return (
    <Link href={url} className="block group min-w-[180px] w-[180px]" onClick={handleClick}>
      <div className="bg-white border-l-4 border-gray-400 rounded-lg overflow-hidden hover:border-gray-600 hover:shadow-lg transition-all duration-300 relative">
        {/* Header - Flow/Continuity design */}
        <div className="relative bg-gradient-to-r from-gray-100 via-gray-50 to-white h-[140px] overflow-hidden">
          {/* SVG Pattern */}
          <FlowPattern progress={displayProgress} />
          
          {/* Central element with progress indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Progress ring background */}
              <svg className="absolute inset-0 transform -rotate-90" width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
                {displayProgress > 0 && (
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="rgba(0,0,0,0.7)"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - displayProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}
              </svg>
              <div className="bg-white border-2 border-gray-500 rounded-lg shadow-lg relative z-10" style={{ width: '4.5rem', height: '4.5rem' }}>
              </div>
            </div>
          </div>

          {/* Continue badge - top left */}
          <div className="absolute top-3 left-3">
            <div className="bg-gray-900 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-md">
              Continue
            </div>
          </div>
          
          {/* Progress percentage - bottom right */}
          {displayProgress > 0 && (
            <div className="absolute bottom-3 right-3">
              <div className="bg-white border-2 border-gray-400 px-2 py-1 rounded shadow-sm">
                <span className="text-[10px] text-gray-900 font-bold tabular-nums">{displayProgress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Content section - highlighted */}
        <div className="px-3.5 py-3 bg-gray-50 border-t-2 border-gray-300">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          {displayProgress > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 transition-all rounded-full"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Left border accent - stronger on hover */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-900 opacity-0 group-hover:opacity-30 transition-opacity" />
      </div>
    </Link>
  )
}
