'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Info, Target, Zap } from 'lucide-react'

interface PromptBoxBlockProps {
  blockId: string
  title: string
  content: string
  type?: 'info' | 'warning' | 'challenge' | 'objective'
  metadata?: {
    timeLimit?: number
    wordLimit?: number
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  }
}

const typeConfig = {
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50',
    iconClassName: 'text-blue-600',
    titleClassName: 'text-blue-900'
  },
  warning: {
    icon: AlertCircle,
    className: 'border-orange-200 bg-orange-50',
    iconClassName: 'text-orange-600',
    titleClassName: 'text-orange-900'
  },
  challenge: {
    icon: Target,
    className: 'border-red-200 bg-red-50',
    iconClassName: 'text-red-600',
    titleClassName: 'text-red-900'
  },
  objective: {
    icon: Zap,
    className: 'border-green-200 bg-green-50',
    iconClassName: 'text-green-600',
    titleClassName: 'text-green-900'
  }
}

export default function PromptBoxBlock({
  blockId,
  title,
  content,
  type = 'info',
  metadata
}: PromptBoxBlockProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <Card className={`${config.className} border-l-4`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-lg ${config.titleClassName}`}>
          <Icon className={`h-5 w-5 ${config.iconClassName}`} />
          {title}
        </CardTitle>
        {metadata && (
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            {metadata.timeLimit && (
              <span>⏱️ {metadata.timeLimit} minutes</span>
            )}
            {metadata.wordLimit && (
              <span>📝 {metadata.wordLimit} words max</span>
            )}
            {metadata.difficulty && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                metadata.difficulty === 'advanced' ? 'bg-red-100 text-red-700' :
                metadata.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {metadata.difficulty.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
          {content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}