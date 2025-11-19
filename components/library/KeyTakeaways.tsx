'use client'

import { useMemo } from 'react'

interface KeyTakeawaysProps {
  content: string
}

export default function KeyTakeaways({ content }: KeyTakeawaysProps) {
  const takeaways = useMemo(() => {
    // First, try to extract from "## Key Takeaways" section
    const takeawaysMatch = content.match(/## Key Takeaways\s*\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/i)
    if (takeawaysMatch) {
      const section = takeawaysMatch[1]
      // Extract bullet points (lines starting with - or *)
      const bullets = section
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && (line.startsWith('-') || line.startsWith('*')))
        .map(line => line.replace(/^[-*]\s+/, '').trim())
        .filter(line => line.length > 0)
      
      if (bullets.length > 0) {
        return bullets
      }
    }
    
    // Fallback: synthesize from H2/H3 headings
    const headings = content.match(/^###?\s+(.+)$/gm)
    if (headings && headings.length > 0) {
      return headings
        .slice(0, 7) // Limit to 7 takeaways
        .map(heading => heading.replace(/^###?\s+/, '').trim())
        .filter(heading => heading.length > 0)
    }
    
    return []
  }, [content])

  if (takeaways.length === 0) {
    return null
  }

  return (
    <div className="bg-neutral-50 border border-neutral-200 p-4 mb-8">
      <h3 className="text-sm font-medium text-neutral-900 mb-3 uppercase tracking-wide">
        Key Takeaways
      </h3>
      <ul className="space-y-2">
        {takeaways.map((takeaway, idx) => (
          <li key={idx} className="text-xs text-neutral-700 leading-relaxed flex items-start gap-2">
            <span className="text-neutral-400 mt-1">•</span>
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}


