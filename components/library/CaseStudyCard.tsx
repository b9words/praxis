'use client'

import { Button } from '@/components/ui/button'
import { Target, PlayCircle, ArrowRight, Clock, Signal } from 'lucide-react'
import Link from 'next/link'

interface CaseStudyCardProps {
  caseId: string
  title: string
  url: string
  description?: string
  competencies?: string[]
  difficulty?: string
  duration?: number
}

export default function CaseStudyCard({
  caseId,
  title,
  url,
  description,
  competencies = [],
  difficulty,
  duration,
}: CaseStudyCardProps) {
  return (
    <div className="mt-12 pt-8 border-t border-neutral-200">
      <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-200 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <PlayCircle className="h-5 w-5 text-gray-900" />
              <h3 className="text-lg font-semibold text-gray-900">
                Put Your Knowledge to the Test
              </h3>
            </div>
            <h4 className="text-base font-medium text-gray-900 mb-2">{title}</h4>
            {description && (
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {competencies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {competencies.slice(0, 4).map((comp, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-neutral-300 rounded text-xs font-medium text-gray-700"
                    >
                      <Target className="h-3 w-3" />
                      <span>{comp}</span>
                    </div>
                  ))}
                  {competencies.length > 4 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{competencies.length - 4} more
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-600">
                {duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{duration} min</span>
                  </div>
                )}
                {difficulty && (
                  <div className="flex items-center gap-1">
                    <Signal className="h-3 w-3" />
                    <span className="uppercase">{difficulty}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button
          asChild
          size="lg"
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none"
        >
          <Link href={url}>
            Start Case Study
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

