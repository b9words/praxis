import { NextRequest, NextResponse } from 'next/server'
import { ContentGenerator, LessonStructure, GenerationOptions } from '@/lib/content-generator'

/**
 * POST /api/content-generation/generate-lesson
 * Generate a single lesson server-side with API keys from environment variables
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lesson, options, competencyId, domainTitle }: {
      lesson: LessonStructure
      options: GenerationOptions
      competencyId: string
      domainTitle?: string
    } = body

    if (!lesson || !options || !competencyId) {
      return NextResponse.json(
        { error: 'Missing required fields: lesson, options, competencyId' },
        { status: 400 }
      )
    }

    // Create generator with API keys from environment (server-side only)
    const openaiKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    if (options.provider === 'openai' && !openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (options.provider === 'gemini' && !geminiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const generator = new ContentGenerator(openaiKey, geminiKey)

    // Generate lesson (this happens server-side, so Prisma in TokenTracker will work)
    const generatedLesson = await generator.generateLesson(lesson, options, competencyId)

    // Generate thumbnail after successful lesson generation
    let thumbnailUrl: string | null = null
    if (domainTitle && generatedLesson.title) {
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
            
            // Add thumbnail to metadata
            if (!generatedLesson.metadata) {
              generatedLesson.metadata = {}
            }
            generatedLesson.metadata.thumbnailUrl = thumbnailUrl
            generatedLesson.metadata.thumbnailType = 'png'
          } else {
            // SVG fallback (legacy)
            const svg = thumbnailData.svg
            thumbnailUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
            
            // Add thumbnail to metadata
            if (!generatedLesson.metadata) {
              generatedLesson.metadata = {}
            }
            generatedLesson.metadata.thumbnailSvg = svg
            generatedLesson.metadata.thumbnailUrl = thumbnailUrl
            generatedLesson.metadata.thumbnailType = 'svg'
          }
        }
      } catch (thumbnailError) {
        console.error('Thumbnail generation failed (non-fatal):', thumbnailError)
        // Don't fail the entire generation if thumbnail fails
      }
    }

    return NextResponse.json({ lesson: generatedLesson })
  } catch (error) {
    console.error('Error generating lesson:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate lesson', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

