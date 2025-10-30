import { createExcerpt } from '@/lib/markdown-utils'

interface MarkdownPreviewProps {
  content: string
  maxLength?: number
  className?: string
}

/**
 * Displays a plain text preview of markdown content
 * Strips all markdown syntax and shows clean excerpt
 */
export default function MarkdownPreview({ 
  content, 
  maxLength = 150,
  className = ''
}: MarkdownPreviewProps) {
  const excerpt = createExcerpt(content, maxLength)
  
  return (
    <p className={`text-sm text-gray-600 line-clamp-3 ${className}`}>
      {excerpt}
    </p>
  )
}

