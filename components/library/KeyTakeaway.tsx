'use client'

import { Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface KeyTakeawayProps {
  content: string
}

export default function KeyTakeaway({ content }: KeyTakeawayProps) {
  return (
    <div className="my-6 border-l-4 border-yellow-500 bg-yellow-50 pl-4 py-3 pr-4 rounded-r">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 prose prose-sm prose-neutral max-w-none">
          <div className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1.5">
            Key Takeaway
          </div>
          <ReactMarkdown>
            {content.trim()}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

