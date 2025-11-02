'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface RecommendedItem {
  id: string
  title: string
  url: string
  competencyName: string
  reason: string
}

interface RecommendedReadingProps {
  recommendations: RecommendedItem[]
  delay: number
}

export default function RecommendedReading({ recommendations, delay }: RecommendedReadingProps) {
  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-sm">
      <div className="border-b border-blue-200 px-6 py-5 bg-white/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Remedial Action Plan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Address competency gaps identified in your performance review
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-3">
        {recommendations.map((item) => (
          <div key={item.id} className="bg-white border border-blue-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                </div>
                <p className="text-xs font-medium text-blue-700 mb-2">{item.competencyName}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.reason}</p>
              </div>
              {item.url ? (
                <Button 
                  asChild 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-none shrink-0"
                >
                  <Link href={item.url} className="gap-2">
                    Review Lesson
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="bg-gray-400 hover:bg-gray-500 text-white rounded-none shrink-0"
                  disabled
                >
                  Review Lesson
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        <div className="pt-3 border-t border-blue-200">
          <Button asChild variant="outline" className="w-full border-blue-300 hover:border-blue-400 text-blue-700 hover:text-blue-800 rounded-none">
            <Link href="/library/curriculum">Browse All Lessons</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
