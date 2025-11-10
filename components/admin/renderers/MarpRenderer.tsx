'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

interface MarpRendererProps {
  content: string
}

export default function MarpRenderer({ content }: MarpRendererProps) {
  const { slides, hasFrontmatter, hasSeparators } = useMemo(() => {
    // Parse Marp deck
    let processed = content.trim()
    
    // Extract frontmatter (between first two --- lines)
    const frontmatterMatch = processed.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
    let slideContent = processed
    const hasFrontmatter = !!frontmatterMatch
    
    if (frontmatterMatch) {
      slideContent = processed.slice(frontmatterMatch[0].length)
    }
    
    // Split by slide separators (\n---\n)
    const slideSeparators = slideContent.split(/\n---\n/)
    const hasSeparators = slideSeparators.length > 1
    const parsedSlides = slideSeparators
      .map(slide => slide.trim())
      .filter(slide => slide.length > 0)
    
    // If no separators found, treat entire content as single slide
    if (parsedSlides.length === 0) {
      parsedSlides.push(slideContent)
    }
    
    return { slides: parsedSlides, hasFrontmatter, hasSeparators }
  }, [content])

  const [currentSlide, setCurrentSlide] = useState(0)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(0, prev - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [slides.length])

  // Try to compile with Marp (if available)
  const [compiledHtml, setCompiledHtml] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)

  useEffect(() => {
    // Dynamically import @marp-team/marp-core only on client
    const compileMarp = async () => {
      try {
        // Check if we should use Marp or fallback
        const useMarp = process.env.NEXT_PUBLIC_ASSET_RENDER_FALLBACK !== 'markdown'
        
        if (useMarp) {
          try {
            const { Marp } = await import('@marp-team/marp-core')
            const marp = new Marp()
            const { html, css } = marp.render(content)
            setCompiledHtml(`<style>${css}</style>${html}`)
            setCompileError(null)
          } catch (importError) {
            // If import fails (package not installed), use fallback
            console.warn('[MarpRenderer] @marp-team/marp-core not available, using fallback:', importError)
            setCompileError('Marp not available')
            setCompiledHtml(null)
          }
        } else {
          // Fallback mode - don't compile
          setCompiledHtml(null)
        }
      } catch (error) {
        console.warn('[MarpRenderer] Failed to compile with Marp, using fallback:', error)
        setCompileError(error instanceof Error ? error.message : 'Unknown error')
        setCompiledHtml(null)
      }
    }

    compileMarp()
  }, [content])

  if (slides.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        <p className="font-semibold mb-1">Unable to parse presentation</p>
        <p className="text-xs">No slides found. Showing raw content instead.</p>
        <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-60">
          {content.substring(0, 500)}
        </pre>
      </div>
    )
  }

  // Show warning if format is not standard Marp
  const showFormatWarning = !hasFrontmatter || !hasSeparators

  // If we have compiled HTML, render it
  if (compiledHtml && !compileError) {
    return (
      <div className="space-y-4">
        {/* Format Warning */}
        {showFormatWarning && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-yellow-800">
                <p className="font-semibold mb-1">Non-standard presentation format</p>
                <p className="text-xs">
                  {!hasFrontmatter && !hasSeparators && 'Missing Marp frontmatter and slide separators.'}
                  {!hasFrontmatter && hasSeparators && 'Missing Marp frontmatter.'}
                  {hasFrontmatter && !hasSeparators && 'Missing slide separators.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-semibold">Presentation</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Slide {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  idx === currentSlide
                    ? 'bg-blue-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Compiled Marp Content */}
        <div 
          className="bg-white border-2 border-gray-200 rounded-lg p-8 min-h-[400px] shadow-sm"
          dangerouslySetInnerHTML={{ __html: compiledHtml }}
        />

        {/* Keyboard hint */}
        <p className="text-xs text-gray-500 text-center">
          Use ← → arrow keys to navigate
        </p>
      </div>
    )
  }

  // Fallback: render slides as markdown (similar to SlidesRenderer)
  return (
    <div className="space-y-4">
      {/* Format Warning */}
      {showFormatWarning && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-yellow-800">
              <p className="font-semibold mb-1">Non-standard presentation format</p>
              <p className="text-xs">
                {!hasFrontmatter && !hasSeparators && 'Missing Marp frontmatter and slide separators. Rendering as single slide.'}
                {!hasFrontmatter && hasSeparators && 'Missing Marp frontmatter. Expected format: ---\\nmarp: true\\n---\\n'}
                {hasFrontmatter && !hasSeparators && 'Missing slide separators. Expected format: slides separated by \\n---\\n'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-semibold">Presentation</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Slide {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === currentSlide
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Slide (Markdown fallback) */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 min-h-[400px] shadow-sm">
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap">{slides[currentSlide]}</div>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-gray-500 text-center">
        Use ← → arrow keys to navigate
      </p>
    </div>
  )
}

