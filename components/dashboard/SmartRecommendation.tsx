'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Step</CardTitle>
          <CardDescription>Your personalized learning path</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>
    )
  }

  // Residency complete
  if (!recommendation.id) {
    return (
      <Card className="border-gold-300 bg-gradient-to-br from-yellow-50 to-amber-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <div>
              <CardTitle className="text-yellow-900">{recommendation.title}</CardTitle>
              <CardDescription className="text-yellow-700">{recommendation.reason}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-yellow-800">
              Congratulations! You've completed all content in Year {recommendation.residencyYear}.
            </p>
            <Button asChild variant="default" className="w-full">
              <Link href="/residency">Advance to Next Year</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isCurriculum = recommendation.type === 'curriculum'

  return (
    <Card className={`border-l-4 ${isCurriculum ? 'border-blue-500' : 'border-green-500'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recommended Next Step</CardTitle>
          {recommendation.residencyYear && (
            <Badge variant="outline" className="text-xs">
              Year {recommendation.residencyYear}
            </Badge>
          )}
        </div>
        <CardDescription>{recommendation.reason}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${isCurriculum ? 'bg-blue-100' : 'bg-green-100'}`}>
            {isCurriculum ? (
              <BookOpen className={`h-6 w-6 ${isCurriculum ? 'text-blue-600' : 'text-green-600'}`} />
            ) : (
              <PlayCircle className={`h-6 w-6 text-green-600`} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
            {recommendation.competencyName && (
              <p className="text-sm text-gray-600 mt-1">{recommendation.competencyName}</p>
            )}
          </div>
        </div>

        <Button asChild className="w-full">
          <Link href={recommendation.type === 'curriculum' ? recommendation.url : `/simulations/${recommendation.id}/brief`}>
            {recommendation.type === 'curriculum' ? 'Continue Learning' : 'Start Simulation'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

