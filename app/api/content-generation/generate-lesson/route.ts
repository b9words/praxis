import { NextRequest, NextResponse } from 'next/server'
import { ContentGenerator, LessonStructure, GenerationOptions } from '@/lib/content-generator'

/**
 * POST /api/content-generation/generate-lesson
 * Generate a single lesson server-side with API keys from environment variables
 */
export async function POST(request: NextRequest) {
  let options: GenerationOptions | undefined
  try {
    const body = await request.json()
    const { lesson, options: opts, competencyId, domainTitle, skipThumbnail }: {
      lesson: LessonStructure
      options: GenerationOptions
      competencyId: string | null
      domainTitle?: string
      skipThumbnail?: boolean
    } = body
    options = opts

    if (!lesson || !opts) {
      return NextResponse.json(
        { error: 'Missing required fields: lesson, options' },
        { status: 400 }
      )
    }

    // If no competencyId provided, try to get a default domain competency
    let finalCompetencyId = competencyId
    if (!finalCompetencyId) {
      const { prisma } = await import('@/lib/prisma/server')
      const defaultCompetency = await prisma.competency.findFirst({
        where: { level: 'domain' },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
      if (defaultCompetency) {
        finalCompetencyId = defaultCompetency.id
        console.log(`[generate-lesson] Using default competency: ${finalCompetencyId}`)
      } else {
        // If no competencies exist at all, use a placeholder
        finalCompetencyId = '00000000-0000-0000-0000-000000000000'
        console.warn(`[generate-lesson] No competencies found, using placeholder`)
      }
    }

    // Create generator with API keys from environment (server-side only)
    const openaiKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    if (opts.provider === 'openai' && !openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (opts.provider === 'gemini' && !geminiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const generator = new ContentGenerator(openaiKey, geminiKey)

    // Generate lesson (this happens server-side, so Prisma in TokenTracker will work)
    const generatedLesson = await generator.generateLesson(lesson, opts, finalCompetencyId)

    // Generate thumbnail after successful lesson generation (unless skipped)
    let thumbnailUrl: string | null = null
    if (!skipThumbnail && domainTitle && generatedLesson.title) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3400'
        const thumbnailResponse = await fetch(`${baseUrl}/api/generate-thumbnail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: generatedLesson.title,
            domainName: domainTitle,
            contentType: 'lesson',
            description: lesson.description || generatedLesson.metadata?.keyTakeaways?.join(' ') || undefined,
            useImagen: true, // Use Imagen generation
          }),
        })

        if (thumbnailResponse.ok) {
          const thumbnailData = await thumbnailResponse.json()
          
          // Handle both PNG (Imagen) and SVG (fallback) responses
          if (thumbnailData.type === 'png') {
            // Imagen generated PNG
            thumbnailUrl = thumbnailData.imageBuffer || thumbnailData.url
            
            // Add thumbnail to metadata (extend existing metadata)
            const metadata = generatedLesson.metadata || {
              moduleNumber: 0,
              lessonNumber: 0,
              estimatedReadingTime: 0,
              keyTakeaways: [],
              visualizations: [],
            }
            ;(metadata as any).thumbnailUrl = thumbnailUrl
            ;(metadata as any).thumbnailType = 'png'
            generatedLesson.metadata = metadata
          } else {
            // SVG fallback (legacy)
            const svg = thumbnailData.svg
            thumbnailUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
            
            // Add thumbnail to metadata (extend existing metadata)
            const metadata = generatedLesson.metadata || {
              moduleNumber: 0,
              lessonNumber: 0,
              estimatedReadingTime: 0,
              keyTakeaways: [],
              visualizations: [],
            }
            ;(metadata as any).thumbnailSvg = svg
            ;(metadata as any).thumbnailUrl = thumbnailUrl
            ;(metadata as any).thumbnailType = 'svg'
            generatedLesson.metadata = metadata
          }
        }
      } catch (thumbnailError) {
        console.error('Thumbnail generation failed (non-fatal):', thumbnailError)
        // Don't fail the entire generation if thumbnail fails
      }
    }

    return NextResponse.json({ lesson: generatedLesson })
  } catch (error: any) {
    console.error('[generate-lesson] Error generating lesson:', error)
    
    // Provide specific error messages for common issues
    let errorMessage = 'Failed to generate lesson'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'
    
    // Check for API key issues
    if (error.message?.includes('API key') || error.message?.includes('not configured')) {
      errorMessage = 'API key not configured'
      errorDetails = `The ${options?.provider || 'selected'} API key is missing or invalid. Please check your environment variables.`
    } else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      errorMessage = 'Rate limit exceeded'
      errorDetails = 'Too many requests. Please wait a moment and try again.'
    } else if (error.message?.includes('model') && (error.message?.includes('not found') || error.message?.includes('does not exist'))) {
      errorMessage = 'Model not found'
      errorDetails = `The model "${options?.model || 'unknown'}" is not available. Please check the model name.`
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Generation timeout'
      errorDetails = 'The generation took too long and was cancelled. Try reducing the target word count or using a faster model.'
    } else if (error.message?.includes('Token limit exceeded')) {
      errorMessage = 'Token limit exceeded'
      errorDetails = error.message
    } else if (error.message?.includes('Generation timeout')) {
      errorMessage = 'Request timeout'
      errorDetails = 'The AI provider did not respond in time. This may be a temporary issue - please try again.'
    } else if (error.code === 'P2021' || error.message?.includes('Table does not exist')) {
      errorMessage = 'Database schema is out of date'
      errorDetails = 'The database schema is missing required tables. Please run `npm run db:push` to update the database schema.'
    } else if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
      errorMessage = 'Database constraint violation'
      errorDetails = 'A referenced record (competency, etc.) does not exist. Please check your data.'
    } else if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
      errorMessage = 'Database connection lost'
      errorDetails = 'The database connection was interrupted. Please try again.'
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    )
  }
}

