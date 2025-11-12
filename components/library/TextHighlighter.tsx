'use client'

import { useEffect, useRef, useState } from 'react'
import { Highlighter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HighlightData {
  id: string
  text: string
  startOffset: number
  endOffset: number
  note?: string
}

interface TextHighlighterProps {
  lessonId?: string
  domainId?: string
  moduleId?: string
  onHighlight?: (highlight: HighlightData) => void
}

export default function TextHighlighter({
  lessonId,
  domainId,
  moduleId,
  onHighlight,
}: TextHighlighterProps) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection()
      if (sel && sel.toString().trim().length > 0) {
        setSelection(sel)
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
        setShowToolbar(true)
      } else {
        setShowToolbar(false)
        setSelection(null)
      }
    }

    document.addEventListener('selectionchange', handleSelection)
    return () => {
      document.removeEventListener('selectionchange', handleSelection)
    }
  }, [])

  const handleHighlight = () => {
    if (!selection || !containerRef.current) return

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString().trim()
    
    if (selectedText.length < 3) return

    // Create highlight span
    const highlightSpan = document.createElement('mark')
    highlightSpan.className = 'bg-yellow-200 text-yellow-900 cursor-pointer'
    highlightSpan.setAttribute('data-highlight-id', `highlight-${Date.now()}`)
    highlightSpan.setAttribute('data-highlight-text', selectedText)
    
    try {
      range.surroundContents(highlightSpan)
      
      const highlightData: HighlightData = {
        id: highlightSpan.getAttribute('data-highlight-id')!,
        text: selectedText,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
      }

      onHighlight?.(highlightData)
      
      // Clear selection
      selection.removeAllRanges()
      setShowToolbar(false)
      setSelection(null)
    } catch (error) {
      // If surroundContents fails, try a different approach
      const contents = range.extractContents()
      highlightSpan.appendChild(contents)
      range.insertNode(highlightSpan)
      
      const highlightData: HighlightData = {
        id: highlightSpan.getAttribute('data-highlight-id')!,
        text: selectedText,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
      }

      onHighlight?.(highlightData)
      
      selection.removeAllRanges()
      setShowToolbar(false)
      setSelection(null)
    }
  }

  const handleCancel = () => {
    if (selection) {
      selection.removeAllRanges()
    }
    setShowToolbar(false)
    setSelection(null)
  }

  if (!showToolbar) return null

  return (
    <>
      <div
        className="fixed z-50 bg-white border border-neutral-200 rounded shadow-lg p-1 flex gap-1"
        style={{
          left: `${toolbarPosition.x}px`,
          top: `${toolbarPosition.y}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={handleHighlight}
          className="h-8 px-2 text-xs"
        >
          <Highlighter className="h-3 w-3 mr-1" />
          Highlight
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 px-2 text-xs"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </>
  )
}

