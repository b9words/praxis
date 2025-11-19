'use client'

import 'highlight.js/styles/github.css'
import mermaid from 'mermaid'
import React, { useEffect, useRef, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'
import EmbeddedQuiz, { QuizQuestion } from '@/components/library/EmbeddedQuiz'
import ReflectionPrompt from '@/components/library/ReflectionPrompt'
import KeyTakeaway from '@/components/library/KeyTakeaway'
import InlineCheck from '@/components/library/InlineCheck'
import ApplyThisNow from '@/components/library/ApplyThisNow'

interface MarkdownProps {
  content: string
  className?: string
  lessonId?: string
  domainId?: string
  moduleId?: string
  initialReflections?: Record<string, string>
}

// Enhanced sanitization schema that allows safe HTML attributes

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'br',
    'sup',
    'sub',
    'details',
    'summary',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': ['className', 'id', 'data-*'],
    a: ['href', 'rel', 'target', 'className', 'id'],
    table: ['className', 'id'],
    thead: ['className', 'id'],
    tbody: ['className', 'id'],
    tr: ['className', 'id'],
    th: ['className', 'id', 'colspan', 'rowspan'],
    td: ['className', 'id', 'colspan', 'rowspan'],
  },
}

// Initialize mermaid once globally with light theme and compact styling
let mermaidInitialized = false
const initMermaid = () => {
  if (!mermaidInitialized && typeof window !== 'undefined') {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      fontSize: 9,
      themeVariables: {
        // McKinsey-style: transparent backgrounds, pure black strokes
        background: 'transparent',
        mainBkgColor: 'transparent',
        secondBkgColor: 'transparent',
        nodeBkg: 'transparent',
        clusterBkg: 'transparent',
        noteBkgColor: 'transparent',
        textColor: '#000000',
        lineColor: '#000000',
        primaryBorderColor: '#000000',
        border1: '#000000',
        border2: '#000000',
        primaryColor: 'transparent',
        primaryTextColor: '#000000',
        secondaryColor: 'transparent',
        tertiaryColor: 'transparent',
        noteTextColor: '#000000',
        noteBorderColor: '#000000',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'linear',
        padding: 1,
        nodeSpacing: 8,
        rankSpacing: 12,
      },
      sequence: {
        diagramMarginX: 8,
        diagramMarginY: 2,
        actorMargin: 15,
        width: 80,
        height: 30,
        boxMargin: 2,
        boxTextMargin: 1,
        noteMargin: 2,
        messageMargin: 10,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false,
      },
      gantt: {
        titleTopMargin: 8,
        barHeight: 8,
        fontSize: 8,
        gridLineStartPadding: 15,
        leftPadding: 35,
        topPadding: 15,
        rightPadding: 15,
      } as any,
      pie: {
        textPosition: 0.75,
      },
    })
    mermaidInitialized = true
  }
}

// Mermaid component with proper initialization and error handling
function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Initialize mermaid on mount
  useEffect(() => {
    initMermaid()
  }, [])

  // Render diagram when chart changes
  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return

    initMermaid()

    const container = ref.current
    const id = `mermaid-${crypto.randomUUID().slice(0, 8)}`
    setError(null)

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (container) {
          container.innerHTML = svg
          // Style the SVG for light background and compact display
          const svgElement = container.querySelector('svg')
          if (svgElement) {
            // Remove any background rects that Mermaid might add
            const backgroundRects = svgElement.querySelectorAll('rect[width][height]')
            backgroundRects.forEach((rect: Element) => {
              const r = rect as SVGRectElement
              const width = r.getAttribute('width')
              const height = r.getAttribute('height')
              const svgWidth = svgElement.getAttribute('width')
              const svgHeight = svgElement.getAttribute('height')
              // If rect covers the entire SVG, it's likely a background
              if (width === svgWidth && height === svgHeight) {
                const fill = r.getAttribute('fill')
                if (fill && fill !== 'none' && fill !== 'transparent') {
                  r.remove()
                }
              }
            })
            
            // McKinsey-style: scale down for compact appearance
            svgElement.setAttribute(
              'style',
              'max-width: 100%; height: auto; background: white !important; background-color: white !important; display: block; transform: scale(0.65); transform-origin: top left;'
            )
            // Set white background
            svgElement.removeAttribute('background')
            svgElement.style.background = 'white'
            svgElement.style.backgroundColor = 'white'
            
            // Clean container styling - account for scaling, white background
            container.style.background = 'white'
            container.style.backgroundColor = 'white'
            container.style.overflow = 'hidden'
            
            // Adjust container size to account for 65% scaling
            // Wait for SVG to be fully rendered before calculating
            setTimeout(() => {
              const originalWidth = svgElement.getAttribute('width')
              const originalHeight = svgElement.getAttribute('height')
              if (originalWidth && originalHeight) {
                const scaledWidth = parseFloat(originalWidth) * 0.65
                const scaledHeight = parseFloat(originalHeight) * 0.65
                container.style.width = `${scaledWidth}px`
                container.style.height = `${scaledHeight}px`
                container.style.minHeight = `${scaledHeight}px`
              } else {
                // Fallback: use getBoundingClientRect if attributes not available
                const rect = svgElement.getBoundingClientRect()
                container.style.width = `${rect.width * 0.65}px`
                container.style.height = `${rect.height * 0.65}px`
                container.style.minHeight = `${rect.height * 0.65}px`
              }
            }, 100)
            
            // Inject comprehensive McKinsey-style CSS with scaling
            const style = document.createElement('style')
            style.textContent = `
              svg#${id} {
                background: white !important;
                background-color: white !important;
                transform: scale(0.65) !important;
                transform-origin: top left !important;
              }
              svg#${id} > rect:first-child {
                display: none !important;
              }
              svg#${id} rect,
              svg#${id} circle,
              svg#${id} ellipse,
              svg#${id} polygon {
                fill: transparent !important;
                stroke: #000 !important;
                stroke-width: 1px !important;
              }
              svg#${id} text,
              svg#${id} tspan {
                fill: #000 !important;
                font-size: 0.5625rem !important;
                font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
                font-weight: 400 !important;
              }
              svg#${id} .edgePath path {
                stroke: #000 !important;
                stroke-width: 1px !important;
                fill: none !important;
              }
              svg#${id} .arrowheadPath,
              svg#${id} marker path {
                fill: #000 !important;
                stroke: #000 !important;
              }
              svg#${id} .cluster rect {
                fill: transparent !important;
                stroke: #000 !important;
                stroke-dasharray: 2,2 !important;
              }
            `
            svgElement.appendChild(style)
            
            // Apply McKinsey-style overrides after render
            setTimeout(() => {
              const allElements = svgElement.querySelectorAll('*')
              allElements.forEach((el: Element) => {
                const element = el as HTMLElement
                
                // Style all shapes with transparent fill and black borders
                if (element.tagName === 'rect' || element.tagName === 'circle' || element.tagName === 'ellipse' || element.tagName === 'polygon') {
                  element.style.fill = 'transparent'
                  element.setAttribute('fill', 'transparent')
                  element.style.stroke = '#000000'
                  element.style.strokeWidth = '1px'
                  element.setAttribute('stroke', '#000000')
                }
                
                // Style all text elements - very small (0.5625rem = 9px)
                if (element.tagName === 'text' || element.tagName === 'tspan') {
                  element.style.fill = '#000000'
                  element.style.fontSize = '0.5625rem'
                  element.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif'
                  element.style.fontWeight = '400'
                  element.setAttribute('fill', '#000000')
                  element.setAttribute('font-size', '0.5625rem')
                }
                
                // Style paths (arrows and lines) - pure black
                if (element.tagName === 'path') {
                  element.style.stroke = '#000000'
                  element.style.strokeWidth = '1px'
                  element.style.fill = element.classList.contains('arrowheadPath') ? '#000000' : 'none'
                  element.setAttribute('stroke', '#000000')
                }
                
                // Style markers - pure black
                if (element.tagName === 'marker') {
                  const paths = element.querySelectorAll('path')
                  paths.forEach((path: Element) => {
                    (path as HTMLElement).style.fill = '#000000'
                    ;(path as HTMLElement).style.stroke = '#000000'
                    ;(path as HTMLElement).setAttribute('fill', '#000000')
                    ;(path as HTMLElement).setAttribute('stroke', '#000000')
                  })
                }
              })
            }, 50)
          }
        }
      })
      .catch((err) => {
        console.error('Mermaid rendering error:', err)
        setError(err.message || 'Failed to render diagram')
        if (container) {
          container.innerHTML = ''
        }
      })
  }, [chart])

  if (error) {
    return (
      <div className="my-4 p-3 border border-red-200 rounded-lg bg-red-50">
        <p className="text-sm text-red-800 font-medium mb-1">Diagram Error</p>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    )
  }

  return <div ref={ref} className="my-1 bg-white" />
}

// Parse interactive blockquote blocks
interface ParsedBlock {
  type: 'QUESTION' | 'REFLECT' | 'KEY-TAKEAWAY' | 'CHECK' | 'APPLY'
  content: string
  startIndex: number
  endIndex: number
  metadata?: Record<string, any>
}

function parseInteractiveBlocks(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  // Match: > [!TYPE] followed by content lines starting with >
  const regex = /^>\s*\[!([A-Z-]+)\]\s*(.*?)$\n((?:^>.*\n?)+?)(?=^>\s*\[!|$)/gm

  let match
  while ((match = regex.exec(content)) !== null) {
    const type = match[1] as ParsedBlock['type']
    const metadataStr = match[2] || ''
    if (type === 'QUESTION' || type === 'REFLECT' || type === 'KEY-TAKEAWAY' || type === 'CHECK' || type === 'APPLY') {
      const fullMatch = match[0]
      const blockquoteContent = match[3] || ''

      // Remove leading '> ' or '>' from each line and trim
      const cleanedContent = blockquoteContent
        .split('\n')
        .map((line) => {
          const cleaned = line.replace(/^>\s*/, '').trim()
          return cleaned
        })
        .filter((line) => line.length > 0)
        .join('\n')
        .trim()

      if (cleanedContent) {
        const block: ParsedBlock = {
          type,
          content: cleanedContent,
          startIndex: match.index!,
          endIndex: match.index! + fullMatch.length,
        }

        // Parse metadata for CHECK blocks (e.g., correct: 0,2,3)
        if (type === 'CHECK' && metadataStr) {
          const metadata: Record<string, any> = {}
          const correctMatch = metadataStr.match(/correct:\s*([0-9,]+)/i)
          if (correctMatch) {
            metadata.correctIndices = correctMatch[1].split(',').map(n => parseInt(n.trim(), 10))
          }
          block.metadata = metadata
        }
        
        // Parse metadata for APPLY blocks (e.g., caseId: abc123, caseTitle: "Case Name")
        if (type === 'APPLY' && metadataStr) {
          const metadata: Record<string, any> = {}
          const caseIdMatch = metadataStr.match(/caseId:\s*([^\s,]+)/i)
          const caseTitleMatch = metadataStr.match(/caseTitle:\s*"([^"]+)"/i)
          if (caseIdMatch) {
            metadata.caseId = caseIdMatch[1]
          }
          if (caseTitleMatch) {
            metadata.caseTitle = caseTitleMatch[1]
          }
          block.metadata = metadata
        }

        blocks.push(block)
      }
    }
  }

  // Sort by start index to ensure correct order
  blocks.sort((a, b) => a.startIndex - b.startIndex)

  return blocks
}

// Parse quiz questions from markdown format
function parseQuizQuestions(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const questionBlocks = content.split(/\n\n+/)

  questionBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n').filter((l) => l.trim())
    if (lines.length === 0) return

    const questionText = lines[0].trim()
    const options: string[] = []
    let correctAnswer = 0

    lines.slice(1).forEach((line, optIndex) => {
      const cleaned = line.replace(/^[-\*]\s*/, '').trim()
      const isCorrect =
        cleaned.includes('(correct)') || cleaned.includes('(correct answer)')
      const optionText = cleaned.replace(/\s*\(correct.*?\)/i, '').trim()

      if (optionText) {
        options.push(optionText)
        if (isCorrect) {
          correctAnswer = optIndex
        }
      }
    })

    if (questionText && options.length >= 2) {
      questions.push({
        id: `quiz-${index}`,
        question: questionText,
        options,
        correctAnswer,
      })
    }
  })

  return questions
}

export default function Markdown({
  content,
  className = '',
  lessonId,
  domainId,
  moduleId,
  initialReflections = {},
}: MarkdownProps) {
  // Parse interactive blocks and split content
  const interactiveBlocks = useMemo(
    () => parseInteractiveBlocks(content),
    [content]
  )

  // Build segments: text blocks and interactive components
  const segments = useMemo(() => {
    const segs: Array<{
      type: 'markdown' | 'component'
      content?: string
      component?: React.ReactNode
    }> = []
    let lastIndex = 0

    interactiveBlocks.forEach((block, index) => {
      // Add markdown segment before this block
      if (block.startIndex > lastIndex) {
        segs.push({
          type: 'markdown',
          content: content.slice(lastIndex, block.startIndex),
        })
      }

      // Add interactive component
      let component: React.ReactNode = null
      switch (block.type) {
        case 'QUESTION': {
          const questions = parseQuizQuestions(block.content)
          if (questions.length > 0) {
            component = (
              <EmbeddedQuiz key={`quiz-${index}`} questions={questions} />
            )
          }
          break
        }
        case 'REFLECT': {
          if (lessonId && domainId && moduleId) {
            const reflectionKey = block.content.substring(0, 50)
            const initialReflection = initialReflections[reflectionKey] || ''
            component = (
              <ReflectionPrompt
                key={`reflect-${index}`}
                prompt={block.content}
                lessonId={lessonId}
                domainId={domainId}
                moduleId={moduleId}
                initialReflection={initialReflection}
              />
            )
          }
          break
        }
        case 'KEY-TAKEAWAY': {
          component = (
            <KeyTakeaway key={`takeaway-${index}`} content={block.content} />
          )
          break
        }
        case 'CHECK': {
          // Parse items from content (each line is an item)
          const items = block.content
            .split('\n')
            .map(line => line.replace(/^[-*]\s*/, '').trim())
            .filter(line => line.length > 0)
          
          if (items.length >= 2 && items.length <= 5) {
            component = (
              <InlineCheck
                key={`check-${index}`}
                items={items}
                correctIndices={block.metadata?.correctIndices}
              />
            )
          }
          break
        }
        case 'APPLY': {
          const caseId = block.metadata?.caseId
          const caseTitle = block.metadata?.caseTitle || 'this case study'
          if (caseId) {
            const caseUrl = `/library/case-studies/${caseId}`
            component = (
              <ApplyThisNow
                key={`apply-${index}`}
                caseId={caseId}
                caseTitle={caseTitle}
                caseUrl={caseUrl}
              />
            )
          }
          break
        }
      }

      if (component) {
        segs.push({ type: 'component', component })
      }

      lastIndex = block.endIndex
    })

    // Add remaining markdown
    if (lastIndex < content.length) {
      segs.push({
        type: 'markdown',
        content: content.slice(lastIndex),
      })
    }

    // If no interactive blocks, just render the content normally
    if (segs.length === 0) {
      segs.push({ type: 'markdown', content })
    }

    return segs
  }, [content, interactiveBlocks, lessonId, domainId, moduleId, initialReflections])

  // Detect density from parent data attribute
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact')
  
  useEffect(() => {
    const element = document.querySelector('[data-density]')
    const densityValue = element?.getAttribute('data-density') as 'compact' | 'comfortable' | null
    if (densityValue === 'comfortable' || densityValue === 'compact') {
      setDensity(densityValue)
    }
  }, [])

  const densityClasses = density === 'comfortable' 
    ? 'prose-lg' 
    : 'prose-sm'

  return (
    <div className={`prose prose-neutral max-w-none ${densityClasses} ${className}`}>
      {segments.map((segment, idx) => {
        if (segment.type === 'component' && segment.component) {
          return React.createElement(
            React.Fragment,
            { key: `segment-${idx}` },
            segment.component
          )
        }

        if (segment.type === 'markdown' && segment.content) {
          return (
            <ReactMarkdown
              key={`md-${idx}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeRaw,
                [rehypeSanitize, sanitizeSchema],
                rehypeHighlight,
                rehypeSlug,
                [
                  rehypeAutolinkHeadings,
                  {
                    behavior: 'wrap',
                    properties: {
                      className: ['anchor-link'],
                      ariaLabel: 'Link to heading',
                    },
                  },
                ],
              ]}
              components={{
                h1: ({ node, children, ...props }) => (
                  <h1
                    className="text-2xl font-semibold text-neutral-900 mt-8 mb-4 leading-tight tracking-tight"
                    {...props}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ node, children, ...props }) => (
                  <h2
                    className="text-xl font-semibold text-neutral-900 mt-6 mb-3 leading-tight tracking-tight"
                    {...props}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ node, children, ...props }) => (
                  <h3
                    className="text-lg font-semibold text-neutral-900 mt-5 mb-2 leading-tight tracking-tight"
                    {...props}
                  >
                    {children}
                  </h3>
                ),
                h4: ({ node, children, ...props }) => (
                  <h4
                    className="text-base font-semibold text-neutral-800 mt-4 mb-2 leading-tight tracking-tight"
                    {...props}
                  >
                    {children}
                  </h4>
                ),
                h5: ({ node, children, ...props }) => (
                  <h5
                    className="text-sm font-semibold text-neutral-800 mt-3 mb-2 leading-tight tracking-tight"
                    {...props}
                  >
                    {children}
                  </h5>
                ),
                h6: ({ node, children, ...props }) => (
                  <h6
                    className="text-xs font-semibold text-neutral-800 mt-3 mb-2 leading-tight tracking-tight"
                    {...props}
                  >
                    {children}
                  </h6>
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="text-sm text-neutral-800 leading-relaxed mb-4"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc list-inside space-y-2 mb-4 text-sm text-neutral-800 ml-4"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="list-decimal list-inside space-y-2 mb-4 text-sm text-neutral-800 ml-4"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li
                    className="text-sm text-neutral-800 leading-relaxed"
                    {...props}
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-blue-700 pl-4 py-2 my-4 bg-neutral-50 text-sm text-neutral-700 italic"
                    {...props}
                  />
                ),
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const language = match ? match[1] : ''

                  if (inline) {
                    return (
                      <code
                        className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }

                  // Handle Mermaid diagrams
                  if (language === 'mermaid') {
                    return (
                      <Mermaid chart={String(children).replace(/\n$/, '')} />
                    )
                  }

                  // Regular code blocks - rehype-highlight will handle syntax highlighting
                  return (
                    <pre
                      className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono"
                      {...props}
                    >
                      <code className={className}>{children}</code>
                    </pre>
                  )
                },
                pre: ({ node, ...props }) => (
                  <pre
                    className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono"
                    {...props}
                  />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table
                      className="min-w-full divide-y divide-neutral-200 border border-neutral-200 text-sm"
                      {...props}
                    />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-neutral-50" {...props} />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody className="divide-y divide-neutral-200 bg-white" {...props} />
                ),
                tr: ({ node, ...props }) => (
                  <tr
                    className="hover:bg-neutral-50 transition-colors"
                    {...props}
                  />
                ),
                th: ({ node, ...props }) => (
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase tracking-wide border-b border-neutral-200"
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    className="px-4 py-2 text-sm text-neutral-800 border-b border-neutral-100"
                    {...props}
                  />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-blue-700 hover:text-blue-800 underline"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong
                    className="font-semibold text-neutral-900"
                    {...props}
                  />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-neutral-700" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-6 border-t border-neutral-200" {...props} />
                ),
                img: ({ node, ...props }) => (
                  <img
                    className="max-w-full h-auto rounded-lg my-4"
                    {...props}
                  />
                ),
              }}
            >
              {segment.content}
            </ReactMarkdown>
          )
        }

        return null
      })}
    </div>
  )
}

