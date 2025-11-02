'use client'

import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { RecommendationWithAlternates } from '@/lib/recommendation-engine'

interface SmartRecommendationProps {
  recommendation: RecommendationWithAlternates
  aggregateScores?: Record<string, number> | null
}

// OPTION 5: Star/Recommendation SVG - Premium/Featured theme
const RecommendationPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none" viewBox="0 0 240 280">
    <defs>
      <pattern id="stars" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <polygon points="30,5 32,15 42,15 34,22 36,32 30,26 24,32 26,22 18,15 28,15" 
                 fill="currentColor" opacity="0.3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#stars)" />
    {/* Central star */}
    <polygon points="120,140 124,152 138,152 128,160 132,174 120,166 108,174 112,160 102,152 116,152" 
             fill="currentColor" opacity="0.2" />
    {/* Connecting lines */}
    <line x1="120" y1="0" x2="120" y2="280" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <line x1="0" y1="140" x2="240" y2="140" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
  </svg>
)

export default function SmartRecommendation({ recommendation, aggregateScores }: SmartRecommendationProps) {
  const primary = recommendation.primary
  
  // Get competency score for display if available
  const getCompetencyScore = (competencyName?: string): number | null => {
    if (!competencyName || !aggregateScores) return null
    
    const normalizedKey = competencyName
      .replace(/\s+/g, '')
      .replace(/^./, str => str.toLowerCase())
    
    if (aggregateScores[normalizedKey] !== undefined) {
      return aggregateScores[normalizedKey]
    }
    
    const camelCaseKey = competencyName
      .split(/\s+/)
      .map((word, idx) => idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
    
    if (aggregateScores[camelCaseKey] !== undefined) {
      return aggregateScores[camelCaseKey]
    }
    
    if (aggregateScores[competencyName] !== undefined) {
      return aggregateScores[competencyName]
    }
    
    return null
  }
  
  const competencyScore = primary?.competencyName ? getCompetencyScore(primary.competencyName) : null
  
  if (!primary) {
    return (
      <Link href="/residency" className="block group min-w-[240px] w-[240px]">
        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden hover:border-gray-500 hover:shadow-2xl transition-all duration-300 relative">
          <div className="relative bg-gradient-to-br from-gray-50 to-white h-[280px] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-gray-400 shadow-xl">
              </div>
            </div>
            <div className="absolute top-4 left-4">
              <div className="bg-gray-900 text-white text-xs font-black px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg">
                Get Started
              </div>
            </div>
          </div>
          <div className="px-4 py-4 border-t-2 border-gray-300">
            <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight">Choose a residency</h3>
            <p className="text-xs text-gray-500 font-medium line-clamp-1">Start your learning journey</p>
          </div>
        </div>
      </Link>
    )
  }

  if (!primary.id) {
    return (
      <Link href="/residency" className="block group min-w-[240px] w-[240px]">
        <div className="bg-white border-2 border-gray-400 rounded-lg overflow-hidden hover:border-gray-600 hover:shadow-2xl transition-all duration-300 relative">
          <div className="relative bg-gradient-to-br from-gray-200 to-gray-100 h-[280px] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-white border-2 border-gray-500 shadow-2xl">
              </div>
            </div>
            <div className="absolute top-4 left-4">
              <div className="bg-gray-900 text-white text-xs font-black px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg">
                Complete!
              </div>
            </div>
          </div>
          <div className="px-4 py-4 border-t-2 border-gray-400">
            <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight">Year {primary.residencyYear} Complete</h3>
            <p className="text-xs text-gray-500 font-medium line-clamp-1">{primary.reason || `All content completed`}</p>
          </div>
        </div>
      </Link>
    )
  }

  const isCurriculum = primary.type === 'curriculum'
  const isSimulation = primary.type === 'simulation'
  const actionUrl = isCurriculum ? (primary.url || `/library/curriculum`) : (primary.id ? `/simulations/${primary.id}/brief` : `/simulations`)

  if (!actionUrl) {
    return (
      <Link href="/library" className="block group min-w-[240px] w-[240px]">
        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden hover:border-gray-500 hover:shadow-2xl transition-all duration-300 relative">
          <div className="relative bg-gradient-to-br from-gray-50 to-white h-[280px] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-gray-400 shadow-xl">
              </div>
            </div>
          </div>
          <div className="px-4 py-4 border-t-2 border-gray-300">
            <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight">Explore Library</h3>
            <p className="text-xs text-gray-500 font-medium line-clamp-1">Browse available content</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={actionUrl} className="block group min-w-[240px] w-[240px]">
      <div className="bg-white border-2 border-gray-400 rounded-lg overflow-hidden hover:border-gray-600 hover:shadow-2xl transition-all duration-300 relative">
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 h-[280px] overflow-hidden">
          {/* SVG Pattern */}
          <RecommendationPattern />
          
          {/* Central element with premium styling */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Decorative rings */}
              <div className="absolute inset-0 rounded-full border-2 border-gray-300 opacity-50 scale-150" />
              <div className="absolute inset-0 rounded-full border-2 border-gray-300 opacity-30 scale-125" />
              
              <div className="w-28 h-28 rounded-2xl bg-white border-2 border-gray-500 shadow-2xl relative z-10 group-hover:scale-105 transition-transform">
              </div>
            </div>
          </div>

          {/* Recommended badge - premium style */}
          <div className="absolute top-4 left-4">
            <div className="bg-gray-900 text-white text-xs font-black px-4 py-2 rounded-lg uppercase tracking-widest shadow-xl group-hover:scale-105 transition-transform">
              Recommended
            </div>
          </div>
          
          {/* Play indicator */}
          <div className="absolute bottom-4 right-4 w-16 h-16 bg-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-2xl">
          </div>
        </div>

        <div className="px-4 py-4 border-t-2 border-gray-300 bg-white">
          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-gray-700 transition-colors">
            {primary.title}
          </h3>
          <p className="text-xs text-gray-600 font-medium mb-2 line-clamp-1">{primary.reason}</p>
          {competencyScore !== null && competencyScore > 0 && (
            <div className="mb-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-300">
              <p className="text-xs text-gray-800 font-bold tabular-nums">
                Score: {competencyScore.toFixed(1)}/5.0
              </p>
            </div>
          )}
          {primary.competencyName && (
            <Badge variant="outline" className="text-xs border-gray-500 text-gray-800 font-semibold bg-gray-50">
              {primary.competencyName}
            </Badge>
          )}
        </div>

        {/* Top border accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-900 opacity-0 group-hover:opacity-30 transition-opacity" />
      </div>
    </Link>
  )
}
