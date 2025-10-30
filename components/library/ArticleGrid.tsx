import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyStateWithSuggestions } from '@/components/ui/empty-state'
import MarkdownPreview from '@/components/ui/markdown-preview'
import { calculateReadingTime } from '@/lib/markdown-utils'
import { BookOpen, Clock, GraduationCap, Target } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  content: string
  competency?: {
    name: string
  } | {
    name: string
  }[]
}

interface ArticleGridProps {
  articles: Article[]
}

export default function ArticleGrid({ articles }: ArticleGridProps) {
  if (!articles || articles.length === 0) {
    return (
      <EmptyStateWithSuggestions
        icon={BookOpen}
        title="No articles found"
        description="Try exploring different areas of the curriculum or start with our recommended learning paths."
        suggestions={[
          {
            title: "Start with Year 1",
            description: "Begin with foundational business concepts",
            href: "/library?year=1",
            icon: GraduationCap
          },
          {
            title: "Browse All Articles",
            description: "Explore our complete article library",
            href: "/library",
            icon: BookOpen
          },
          {
            title: "Try Simulations",
            description: "Apply knowledge in practice scenarios",
            href: "/simulations",
            icon: Target
          }
        ]}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => {
        const readingTime = calculateReadingTime(article.content)
        const competency = Array.isArray(article.competency) ? article.competency[0] : article.competency

        return (
          <Link key={article.id} href={`/library/curriculum`}>
            <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer border border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {competency?.name || 'General'}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{readingTime} min</span>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2 leading-tight">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownPreview content={article.content} maxLength={120} />
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

