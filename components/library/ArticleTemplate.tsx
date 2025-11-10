import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownRenderer from '@/components/ui/Markdown'
import { ArticleSection } from '@/lib/parse-article-template'
import { AlertTriangle, Cog, Lightbulb, Target } from 'lucide-react'

interface ArticleTemplateProps {
  sections: ArticleSection[]
}

export default function ArticleTemplate({ sections }: ArticleTemplateProps) {
  const getSectionIcon = (type: ArticleSection['type']) => {
    switch (type) {
      case 'core_principle':
        return <Target className="h-6 w-6 text-blue-600" />
      case 'framework':
        return <Cog className="h-6 w-6 text-green-600" />
      case 'pitfalls':
        return <AlertTriangle className="h-6 w-6 text-red-600" />
      case 'application':
        return <Lightbulb className="h-6 w-6 text-purple-600" />
      default:
        return <Target className="h-6 w-6 text-gray-600" />
    }
  }

  const getSectionColor = (type: ArticleSection['type']) => {
    switch (type) {
      case 'core_principle':
        return 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-25'
      case 'framework':
        return 'border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-green-25'
      case 'pitfalls':
        return 'border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-25'
      case 'application':
        return 'border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-25'
      default:
        return 'border-l-4 border-gray-500 bg-gradient-to-r from-gray-50 to-gray-25'
    }
  }

  const getSectionTitle = (type: ArticleSection['type']) => {
    switch (type) {
      case 'core_principle':
        return 'Core Principle'
      case 'framework':
        return 'The Framework'
      case 'pitfalls':
        return 'Common Pitfalls'
      case 'application':
        return 'Application Example'
      default:
        return 'Section'
    }
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No structured content found</p>
        <p className="text-sm mt-2">This article doesn't follow the template structure</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <Card key={index} className={`shadow-lg ${getSectionColor(section.type)}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                {getSectionIcon(section.type)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {getSectionTitle(section.type)}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {section.type === 'core_principle' && 'The fundamental concept you need to understand'}
                  {section.type === 'framework' && 'The practical model or process to follow'}
                  {section.type === 'pitfalls' && 'Common mistakes to avoid in practice'}
                  {section.type === 'application' && 'Real-world example showing this in action'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-white pt-0">
            <div className="prose prose-lg max-w-none">
              <MarkdownRenderer content={section.content} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

