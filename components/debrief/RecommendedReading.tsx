'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface RecommendedArticle {
  id: string
  title: string
  competencyName: string
  reason: string
}

interface RecommendedReadingProps {
  recommendations: RecommendedArticle[]
  delay: number
}

export default function RecommendedReading({ recommendations, delay }: RecommendedReadingProps) {
  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-white border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-gray-600" />
          <div>
            <h2 className="text-lg font-medium text-gray-900">Further Intelligence</h2>
            <p className="text-xs text-gray-500 mt-1">
              Recommended reading to address identified competency gaps
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {recommendations.map((article) => (
          <div key={article.id} className="border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">{article.title}</h4>
                <p className="text-xs text-gray-500 mb-2">{article.competencyName}</p>
                <p className="text-xs text-gray-600">{article.reason}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="border-gray-300 hover:border-gray-400 rounded-none shrink-0">
                <Link href={`/library/curriculum?focus=${article.id}`} className="gap-2">
                  Read
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
        
        <div className="pt-2">
          <Button asChild variant="outline" className="w-full border-gray-300 hover:border-gray-400 rounded-none">
            <Link href="/library">Browse All Articles</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
