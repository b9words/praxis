'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
    >
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-purple-900">Recommended Reading</CardTitle>
              <CardDescription className="text-purple-700">
                Strengthen your knowledge in areas for improvement
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {recommendations.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2 + (index * 0.1), duration: 0.4 }}
            >
              <Card className="border border-purple-200 bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{article.title}</h4>
                      <p className="text-sm text-purple-600 mb-2">{article.competencyName}</p>
                      <p className="text-sm text-gray-600 italic">{article.reason}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link href={`/library/curriculum`} className="gap-2">
                        Read
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 + (recommendations.length * 0.1), duration: 0.4 }}
            className="pt-2"
          >
            <Button asChild variant="default" className="w-full">
              <Link href="/library">Browse All Articles</Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}