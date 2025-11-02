'use client'

import { trackEvents } from '@/lib/analytics'
import Link from 'next/link'

interface NewContentCardProps {
  type: 'lesson' | 'case'
  title: string
  url: string
  id?: string
}

// OPTION 4: Burst/Radial SVG - New/Fresh theme
const BurstPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-8" preserveAspectRatio="none" viewBox="0 0 180 140">
    <defs>
      {/* Radial burst */}
      <radialGradient id="burst">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Burst lines from center */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 360) / 12
      const radians = (angle * Math.PI) / 180
      const x1 = 90
      const y1 = 70
      const x2 = 90 + Math.cos(radians) * 60
      const y2 = 70 + Math.sin(radians) * 60
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.4"
        />
      )
    })}
    {/* Center circle */}
    <circle cx="90" cy="70" r="20" fill="url(#burst)" />
    {/* Floating dots */}
    <circle cx="30" cy="30" r="2" fill="currentColor" opacity="0.3" />
    <circle cx="150" cy="30" r="2" fill="currentColor" opacity="0.3" />
    <circle cx="30" cy="110" r="2" fill="currentColor" opacity="0.3" />
    <circle cx="150" cy="110" r="2" fill="currentColor" opacity="0.3" />
  </svg>
)

export default function NewContentCard({
  type,
  title,
  url,
  id,
}: NewContentCardProps) {
  const handleClick = () => {
    if (id) {
      trackEvents.dashboardCardClicked(type, id, 'New on Execemy')
    }
  }


  if (!url) {
    return null
  }

  return (
    <Link href={url} className="block group min-w-[180px] w-[180px]" onClick={handleClick}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-500 hover:shadow-xl transition-all duration-300 relative">
        {/* Header - Burst/New design */}
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 h-[140px] overflow-hidden">
          {/* SVG Pattern */}
          <BurstPattern />
          
          {/* Central element with pulsing effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Pulsing rings on hover */}
              <div className="absolute inset-0 rounded-full border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity scale-150 group-hover:scale-175" />
              <div className="absolute inset-0 rounded-full border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity scale-125 group-hover:scale-150 delay-75" />
              
              {/* Container - diamond/angular shape */}
              <div className="relative bg-white border-2 border-dashed border-gray-400 transform rotate-45 group-hover:rotate-0 transition-transform duration-300 shadow-lg" style={{ width: '4.5rem', height: '4.5rem' }}>
              </div>
            </div>
          </div>

          {/* NEW badge - animated */}
          <div className="absolute top-3 right-3">
            <div className="bg-gray-900 text-white text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg group-hover:scale-110 transition-transform">
              New
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="px-3.5 py-3 border-t border-gray-200 bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
        </div>

        {/* Top corner accent */}
        <div className="absolute top-0 right-0 w-16 h-16">
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-gray-900 opacity-0 group-hover:opacity-5 transition-opacity" />
        </div>
      </div>
    </Link>
  )
}
