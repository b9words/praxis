import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  children?: React.ReactNode
  className?: string
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  children,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`border border-gray-200 bg-white ${className}`}>
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 max-w-md">{description}</p>
        {action && action.href && (
          <Button asChild className="rounded-none bg-gray-900 hover:bg-gray-800 text-white">
            <Link href={action.href}>
              {action.label}
            </Link>
          </Button>
        )}
        {children}
      </div>
    </div>
  )
}

interface EmptyStateGridProps {
  icon: LucideIcon
  title: string
  description: string
  suggestions: Array<{
    title: string
    description: string
    href: string
    icon: LucideIcon
  }>
}

export function EmptyStateWithSuggestions({ 
  icon: Icon, 
  title, 
  description, 
  suggestions 
}: EmptyStateGridProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <Icon className="h-10 w-10 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
            {suggestion.href ? (
              <Link href={suggestion.href}>
                <div className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto">
                    <suggestion.icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600">{suggestion.description}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="p-6 text-center space-y-4 opacity-50">
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto">
                  <suggestion.icon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}