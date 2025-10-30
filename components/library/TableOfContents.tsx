'use client'

import { useEffect, useState } from 'react'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,3})\s+(.+)$/gm
    const headings: TOCItem[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      headings.push({ id, text, level })
    }

    setToc(headings)
  }, [content])

  useEffect(() => {
    // Track scroll position and highlight active heading
    const handleScroll = () => {
      const headingElements = toc.map(item => 
        document.getElementById(item.id)
      ).filter(Boolean)

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i]
        if (element && element.getBoundingClientRect().top <= 100) {
          setActiveId(toc[i].id)
          return
        }
      }
      
      if (toc.length > 0) {
        setActiveId(toc[0].id)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      })
    }
  }

  if (toc.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-gray-900 mb-3">Table of Contents</h3>
      <nav className="space-y-1">
        {toc.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item.id)}
            className={`
              block w-full text-left text-sm py-1 px-2 rounded transition-colors
              ${item.level === 2 ? 'pl-4' : ''}
              ${item.level === 3 ? 'pl-6' : ''}
              ${
                activeId === item.id
                  ? 'text-blue-600 bg-blue-50 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {item.text}
          </button>
        ))}
      </nav>
    </div>
  )
}

