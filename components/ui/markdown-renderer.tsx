'use client'

import 'highlight.js/styles/github.css'
import mermaid from 'mermaid'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import EmbeddedQuiz, { QuizQuestion } from '@/components/library/EmbeddedQuiz'
import ReflectionPrompt from '@/components/library/ReflectionPrompt'
import KeyTakeaway from '@/components/library/KeyTakeaway'

interface MarkdownRendererProps {
  content: string
  className?: string
  lessonId?: string
  domainId?: string
  moduleId?: string
  initialReflections?: Record<string, string>
}

// Mermaid component for rendering diagrams
function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      // Initialize mermaid with configuration
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: 14,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          diagramMarginX: 50,
          diagramMarginY: 10,
          actorMargin: 50,
          width: 150,
          height: 65,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
          mirrorActors: true,
          bottomMarginAdj: 1,
          useMaxWidth: true,
          rightAngles: false,
          showSequenceNumbers: false
        },
        gantt: {
          titleTopMargin: 25,
          barHeight: 20,
          fontSize: 11,
          gridLineStartPadding: 35,
          leftPadding: 75,
          topPadding: 50,
          rightPadding: 35
        } as any
      })

      // Generate unique ID for this diagram
      const id = `mermaid-${crypto.randomUUID().slice(0, 8)}`
      
      // Render the diagram
      mermaid.render(id, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg
        }
      }).catch((error) => {
        console.error('Mermaid rendering error:', error)
        if (ref.current) {
          ref.current.innerHTML = `<div class="text-red-500 text-sm p-4 border border-red-200 rounded">Error rendering diagram: ${error.message}</div>`
        }
      })
    }
  }, [chart])

  return <div ref={ref} className="my-6 flex justify-center" />
}

// Parse interactive blockquote blocks
interface ParsedBlock {
  type: 'QUESTION' | 'REFLECT' | 'KEY-TAKEAWAY'
  content: string
  startIndex: number
  endIndex: number
}

function parseInteractiveBlocks(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  // Match: > [!TYPE] followed by content lines starting with >
  // This regex handles:
  // - Optional whitespace after >
  // - Block type in brackets
  // - Content that continues until next > [!TYPE] or end of blockquote
  const regex = /^>\s*\[!([A-Z-]+)\]\s*$\n((?:^>.*\n?)+?)(?=^>\s*\[!|$)/gm
  
  let match
  while ((match = regex.exec(content)) !== null) {
    const type = match[1] as ParsedBlock['type']
    if (type === 'QUESTION' || type === 'REFLECT' || type === 'KEY-TAKEAWAY') {
      const fullMatch = match[0]
      const blockquoteContent = match[2] || ''
      
      // Remove leading '> ' or '>' from each line and trim
      // Also handle lines that might have just whitespace after >
      const cleanedContent = blockquoteContent
        .split('\n')
        .map(line => {
          // Remove blockquote marker
          const cleaned = line.replace(/^>\s*/, '').trim()
          return cleaned
        })
        .filter(line => line.length > 0) // Remove empty lines
        .join('\n')
        .trim()
      
      if (cleanedContent) {
        blocks.push({
          type,
          content: cleanedContent,
          startIndex: match.index!,
          endIndex: match.index! + fullMatch.length,
        })
      }
    }
  }
  
  // Sort by start index to ensure correct order
  blocks.sort((a, b) => a.startIndex - b.startIndex)
  
  return blocks
}

// Parse quiz questions from markdown format
// Format: Question text\n- Option 1\n- Option 2\n- Option 3 (correct)
function parseQuizQuestions(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const questionBlocks = content.split(/\n\n+/)
  
  questionBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n').filter(l => l.trim())
    if (lines.length === 0) return
    
    const questionText = lines[0].trim()
    const options: string[] = []
    let correctAnswer = 0
    
    lines.slice(1).forEach((line, optIndex) => {
      const cleaned = line.replace(/^[-\*]\s*/, '').trim()
      const isCorrect = cleaned.includes('(correct)') || cleaned.includes('(correct answer)')
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

export default function MarkdownRenderer({ 
  content, 
  className = '',
  lessonId,
  domainId,
  moduleId,
  initialReflections = {},
}: MarkdownRendererProps) {
  // Function to generate ID from heading text
  const generateId = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }

  // Parse interactive blocks and split content
  const interactiveBlocks = parseInteractiveBlocks(content)
  
  // Build segments: text blocks and interactive components
  const segments: Array<{ type: 'markdown' | 'component', content?: string, component?: React.ReactNode }> = []
  let lastIndex = 0
  
  interactiveBlocks.forEach((block, index) => {
    // Add markdown segment before this block
    if (block.startIndex > lastIndex) {
      segments.push({
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
          component = <EmbeddedQuiz key={`quiz-${index}`} questions={questions} />
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
        component = <KeyTakeaway key={`takeaway-${index}`} content={block.content} />
        break
      }
    }
    
    if (component) {
      segments.push({ type: 'component', component })
    }
    
    lastIndex = block.endIndex
  })
  
  // Add remaining markdown
  if (lastIndex < content.length) {
    segments.push({
      type: 'markdown',
      content: content.slice(lastIndex),
    })
  }
  
  // If no interactive blocks, just render the content normally
  if (segments.length === 0) {
    segments.push({ type: 'markdown', content })
  }

  return (
    <div className={`prose prose-neutral max-w-none ${className}`}>
      {segments.map((segment, idx) => {
        if (segment.type === 'component' && segment.component) {
          return <React.Fragment key={`segment-${idx}`}>{segment.component}</React.Fragment>
        }
        
        if (segment.type === 'markdown' && segment.content) {
          return (
            <ReactMarkdown
              key={`md-${idx}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
          h1: ({ node, children, ...props }) => {
            const text = typeof children === 'string' ? children : String(children)
            return (
              <h1 id={generateId(text)} className="text-2xl font-semibold text-neutral-900 mt-8 mb-4 leading-tight" {...props}>
                {children}
              </h1>
            )
          },
          h2: ({ node, children, ...props }) => {
            const text = typeof children === 'string' ? children : String(children)
            return (
              <h2 id={generateId(text)} className="text-xl font-semibold text-neutral-900 mt-6 mb-3 leading-tight" {...props}>
                {children}
              </h2>
            )
          },
          h3: ({ node, children, ...props }) => {
            const text = typeof children === 'string' ? children : String(children)
            return (
              <h3 id={generateId(text)} className="text-lg font-semibold text-neutral-900 mt-5 mb-2 leading-tight" {...props}>
                {children}
              </h3>
            )
          },
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-semibold text-neutral-800 mt-4 mb-2 leading-tight" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-sm text-neutral-800 leading-relaxed mb-4" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-sm text-neutral-800" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-sm text-neutral-800" {...props} />
          ),
          li: ({ node, ...props}) => (
            <li className="text-sm text-neutral-800 leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-700 pl-4 py-2 my-4 bg-neutral-50 text-sm text-neutral-700 italic" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (inline) {
              return <code className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
            }
            
            // Handle Mermaid diagrams
            if (language === 'mermaid') {
              return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
            }
            
            return (
              <code className="block bg-neutral-900 text-neutral-100 p-4 rounded-lg text-xs font-mono overflow-x-auto my-4" {...props}>
                {children}
              </code>
            )
          },
          pre: ({ node, ...props }) => (
            <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto my-4" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-neutral-200 border border-neutral-200 text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-neutral-50" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-neutral-200 bg-white" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-neutral-50 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left text-xs font-medium text-neutral-600 uppercase tracking-wide" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm text-neutral-800" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-700 hover:text-blue-800 underline" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-neutral-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-neutral-700" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t border-neutral-200" {...props} />
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


