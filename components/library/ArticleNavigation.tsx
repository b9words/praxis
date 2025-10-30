import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ArticleNavigationProps {
  previousArticle?: {
    id: string
    title: string
  }
  nextArticle?: {
    id: string
    title: string
  }
}

export default function ArticleNavigation({
  previousArticle,
  nextArticle,
}: ArticleNavigationProps) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-200">
      <div>
        {previousArticle && (
          <Link href={`/library/curriculum`}>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3 px-4">
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              <div className="text-left overflow-hidden">
                <div className="text-xs text-gray-500 mb-1">Previous</div>
                <div className="text-sm font-medium truncate">{previousArticle.title}</div>
              </div>
            </Button>
          </Link>
        )}
      </div>
      <div>
        {nextArticle && (
          <Link href={`/library/curriculum`}>
            <Button variant="outline" className="w-full justify-end gap-2 h-auto py-3 px-4">
              <div className="text-right overflow-hidden">
                <div className="text-xs text-gray-500 mb-1">Next</div>
                <div className="text-sm font-medium truncate">{nextArticle.title}</div>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

