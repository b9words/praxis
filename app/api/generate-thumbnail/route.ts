import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateImagenThumbnail } from '@/lib/thumbnail-dalle'


/**
 * Upload processed thumbnail to Supabase Storage and update database
 */
async function uploadThumbnailToStorage(
  imageBuffer: Buffer,
  contentId: string,
  contentType: 'lesson' | 'case',
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const thumbnailPath = `${contentType === 'lesson' ? 'thumbnails/articles' : 'thumbnails/cases'}/${contentId}.png`
  
  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('assets')
    .upload(thumbnailPath, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload thumbnail: ${uploadError.message}`)
  }

  // Get public URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const thumbnailUrl = `${supabaseUrl}/storage/v1/object/public/assets/${thumbnailPath}`

  // Update database
  const tableName = contentType === 'lesson' ? 'articles' : 'cases'
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ thumbnail_url: thumbnailUrl })
    .eq('id', contentId)

  if (updateError) {
    throw new Error(`Failed to update thumbnail_url: ${updateError.message}`)
  }

  return thumbnailUrl
}

/**
 * Generate Imagen thumbnail and process it
 */
async function generateImagenThumbnailWithProcessing(
  title: string,
  description: string | undefined,
  contentId: string | null,
  contentType: 'lesson' | 'case',
  supabase: ReturnType<typeof createClient> | null
): Promise<{ url: string; imageBuffer: string }> {
  try {
    // Stage 1 & 2: Generate Imagen image
    const imagenImageUrl = await generateImagenThumbnail(title, description)

    // Stage 3: Process image (crop and resize)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3400'
    const processResponse = await fetch(`${baseUrl}/api/thumbnail/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imagenImageUrl,
        targetWidth: 300,
        targetHeight: 400,
      }),
    })

    if (!processResponse.ok) {
      throw new Error('Failed to process Imagen image')
    }

    const { imageBuffer: dataUri } = await processResponse.json()

    // If contentId provided, upload to storage and update DB
    let thumbnailUrl = dataUri // Default to data URI
    if (contentId && supabase) {
      try {
        // Convert data URI to buffer for upload
        const base64Data = dataUri.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        thumbnailUrl = await uploadThumbnailToStorage(buffer, contentId, contentType, supabase)
      } catch (uploadError) {
        console.error('Failed to upload thumbnail, using data URI:', uploadError)
        // Continue with data URI if upload fails
      }
    }

    return {
      url: thumbnailUrl,
      imageBuffer: dataUri,
    }
  } catch (error) {
    console.error('Imagen thumbnail generation failed:', error)
    throw error
  }
}

// ============================================================================
// DALL-E 3 FUNCTION (COMMENTED OUT - Using Imagen instead)
// ============================================================================

/**
 * Generate DALL-E thumbnail and process it (COMMENTED OUT - using Imagen instead)
 */
// async function generateDalleThumbnailWithProcessing(
//   title: string,
//   description: string | undefined,
//   contentId: string | null,
//   contentType: 'lesson' | 'case',
//   supabase: ReturnType<typeof createClient> | null
// ): Promise<{ url: string; imageBuffer: string }> {
//   try {
//     // Stage 1 & 2: Generate DALL-E image
//     const dalleImageUrl = await generateDalleThumbnail(title, description, 'hd')
//
//     // Stage 3: Process image (crop and resize)
//     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3400'
//     const processResponse = await fetch(`${baseUrl}/api/thumbnail/process`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         imageUrl: dalleImageUrl,
//         targetWidth: 300,
//         targetHeight: 400,
//       }),
//     })
//
//     if (!processResponse.ok) {
//       throw new Error('Failed to process DALL-E image')
//     }
//
//     const { imageBuffer: dataUri } = await processResponse.json()
//
//     // If contentId provided, upload to storage and update DB
//     let thumbnailUrl = dataUri // Default to data URI
//     if (contentId && supabase) {
//       try {
//         // Convert data URI to buffer for upload
//         const base64Data = dataUri.replace(/^data:image\/png;base64,/, '')
//         const buffer = Buffer.from(base64Data, 'base64')
//         thumbnailUrl = await uploadThumbnailToStorage(buffer, contentId, contentType, supabase)
//       } catch (uploadError) {
//         console.error('Failed to upload thumbnail, using data URI:', uploadError)
//         // Continue with data URI if upload fails
//       }
//     }
//
//     return {
//       url: thumbnailUrl,
//       imageBuffer: dataUri,
//     }
//   } catch (error) {
//     console.error('DALL-E thumbnail generation failed:', error)
//     throw error
//   }
// }

export async function POST(request: NextRequest) {
  try {
    const { 
      contentId, 
      contentType, 
      title, 
      domainName, 
      competencyName,
      description,
      useImagen = false // New parameter: use Imagen generation instead of SVG
    } = await request.json()

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let supabase: ReturnType<typeof createClient> | null = null

    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    }

    // If contentId provided, fetch from DB
    if (contentId) {
      if (!supabase) {
        return NextResponse.json(
          { error: 'Supabase credentials not configured' },
          { status: 500 }
        )
      }

      if (contentType === 'lesson') {
        const { data: article } = await supabase
          .from('articles')
          .select('title, description, metadata, competency:competencies(name)')
          .eq('id', contentId)
          .single()

        if (!article) {
          return NextResponse.json({ error: 'Article not found' }, { status: 404 })
        }

        const articleData = article as any

        // Use Imagen generation if requested
        if (useImagen) {
          try {
            const { url, imageBuffer } = await generateImagenThumbnailWithProcessing(
              articleData.title,
              articleData.description || undefined,
              contentId,
              'lesson',
              supabase
            )
            return NextResponse.json({ 
              url, 
              imageBuffer,
              type: 'png' 
            })
          } catch (imagenError) {
            console.error('Imagen generation failed:', imagenError)
            // Return empty response on failure
            return NextResponse.json({ 
              url: null, 
              imageBuffer: null,
              type: 'png',
              error: 'Imagen generation failed' 
            })
          }
        }

        // No fallback - return empty if Imagen not requested
        return NextResponse.json({ 
          url: null, 
          imageBuffer: null,
          type: 'png' 
        })
      } else {
        const { data: caseData } = await supabase
          .from('cases')
          .select(`
            title,
            description,
            competencies:case_competencies(
              competency:competencies(name)
            )
          `)
          .eq('id', contentId)
          .single()

        if (!caseData) {
          return NextResponse.json({ error: 'Case not found' }, { status: 404 })
        }

        const caseDataTyped = caseData as any

        // Use Imagen generation if requested
        if (useImagen) {
          try {
            const { url, imageBuffer } = await generateImagenThumbnailWithProcessing(
              caseDataTyped.title,
              caseDataTyped.description || undefined,
              contentId,
              'case',
              supabase
            )
            return NextResponse.json({ 
              url, 
              imageBuffer,
              type: 'png' 
            })
          } catch (imagenError) {
            console.error('Imagen generation failed:', imagenError)
            // Return empty response on failure
            return NextResponse.json({ 
              url: null, 
              imageBuffer: null,
              type: 'png',
              error: 'Imagen generation failed' 
            })
          }
        }

        // No fallback - return empty if Imagen not requested
        return NextResponse.json({ 
          url: null, 
          imageBuffer: null,
          type: 'png' 
        })
      }
    }

    // Direct generation from provided params
    if (!title) {
      return NextResponse.json(
        { error: 'Missing title' },
        { status: 400 }
      )
    }

    // Use Imagen generation if requested
    if (useImagen) {
      try {
        const { url, imageBuffer } = await generateImagenThumbnailWithProcessing(
          title,
          description,
          null, // No contentId for direct generation
          contentType || 'lesson',
          null // No supabase for direct generation
        )
        return NextResponse.json({ 
          url, 
          imageBuffer,
          type: 'png' 
        })
      } catch (imagenError) {
        console.error('Imagen generation failed:', imagenError)
        // Return empty response on failure
        return NextResponse.json({ 
          url: null, 
          imageBuffer: null,
          type: 'png',
          error: 'Imagen generation failed' 
        })
      }
    }

    // No fallback - return empty if Imagen not requested
    return NextResponse.json({ 
      url: null, 
      imageBuffer: null,
      type: 'png' 
    })
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate thumbnail', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

