import { Badge } from '@/components/ui/badge'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
  progress?: {
    completed: number
    total: number
  }
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mb-6 p-4 bg-gray-50 rounded-lg border">
      <Link 
        href="/dashboard" 
        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
      >
        <Home className="h-3 w-3" />
        <span>Dashboard</span>
      </Link>
      <ChevronRight className="h-4 w-4 text-gray-400" />
      <Link href="/library" className="hover:text-gray-900 transition-colors">
        Library
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <div className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-900 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{item.label}</span>
            )}
            {item.progress && (
              <Badge variant="secondary" className="text-xs">
                {item.progress.completed}/{item.progress.total}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </nav>
  )
}

