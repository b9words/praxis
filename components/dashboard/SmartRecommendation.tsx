'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/ui/empty-state'
import { Recommendation } from '@/lib/recommendation-engine'
import { BookOpen, PlayCircle, Target, Trophy } from 'lucide-react'
import Link from 'next/link'

interface SmartRecommendationProps {
  recommendation: Recommendation | null
}

export default function SmartRecommendation({ recommendation }: SmartRecommendationProps) {
  if (!recommendation) {
    return (
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Optimal Next Move</h2>
          <p className="text-xs text-gray-500 mt-1">Your personalized learning path</p>
        </div>
        <div className="p-6">
          <EmptyState
            icon={Target}
            title="Choose Your Path"
            description="Select a residency to get personalized recommendations based on your learning progress."
            action={{
              label: "Choose Residency",
              href: "/residency"
            }}
            className="border-0 shadow-none"
          />
        </div>
      </div>
    )
  }

  // Residency complete
  if (!recommendation.id) {
    return (
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">{recommendation.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{recommendation.reason}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You have completed all content in Year {recommendation.residencyYear}. Advance to the next residency.
            </p>
            <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none">
              <Link href="/residency">Advance to Next Year</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isCurriculum = recommendation.type === 'curriculum'

  return (
    <div className="bg-white border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Optimal Next Move</h2>
          {recommendation.residencyYear && (
            <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
              Year {recommendation.residencyYear}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">{recommendation.reason}</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-50 border border-gray-200">
            {isCurriculum ? (
              <BookOpen className="h-6 w-6 text-gray-700" />
            ) : (
              <PlayCircle className="h-6 w-6 text-gray-700" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-gray-900">{recommendation.title}</h3>
            {recommendation.competencyName && (
              <p className="text-xs text-gray-500 mt-1">{recommendation.competencyName}</p>
            )}
          </div>
        </div>

        <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none">
          <Link href={recommendation.type === 'curriculum' ? recommendation.url : `/simulations/${recommendation.id}/brief`}>
            Engage Target
          </Link>
        </Button>
      </div>
    </div>
  )
}
