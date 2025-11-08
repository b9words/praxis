/**
 * Imagen Thumbnail Generation Helper Functions
 * Two-stage AI pipeline: Gemini 2.5 Flash for conceptual scenes, Google Imagen 4 (via Replicate) for image generation
 */

import Replicate from 'replicate'

/**
 * Build deterministic metaphor from title keywords (no API call)
 */
function buildDeterministicMetaphor(title: string, description?: string): string {
  const titleLower = title.toLowerCase()
  const text = (description || title).toLowerCase()
  
  // Keyword-based mapping
  if (titleLower.includes('risk') || text.includes('risk')) {
    return 'A narrow footbridge over a deep canyon under steady wind.'
  }
  if (titleLower.includes('growth') || text.includes('growth') || text.includes('expand')) {
    return 'A sapling breaking through cracked concrete toward sunlight.'
  }
  if (titleLower.includes('system') || text.includes('system') || text.includes('process')) {
    return 'Interlocking gears smoothly turning in tight alignment.'
  }
  if (titleLower.includes('strateg') || text.includes('strateg') || text.includes('plan')) {
    return 'A compass pointing through morning fog toward a distant peak.'
  }
  if (titleLower.includes('tradeoff') || text.includes('tradeoff') || text.includes('balance')) {
    return 'Two balanced scales with different precious items on each side.'
  }
  if (titleLower.includes('decision') || text.includes('decision') || text.includes('choose')) {
    return 'A fork in a forest path with both routes leading into misty distance.'
  }
  if (titleLower.includes('leadership') || text.includes('leadership') || text.includes('lead')) {
    return 'A lighthouse casting a steady beam over calm water at dusk.'
  }
  if (titleLower.includes('team') || text.includes('team') || text.includes('collaborat')) {
    return 'Multiple hands working together to lift a heavy stone into place.'
  }
  if (titleLower.includes('innov') || text.includes('innov') || text.includes('creat')) {
    return 'A single lightbulb illuminating a dark workshop filled with tools.'
  }
  if (titleLower.includes('value') || text.includes('value') || text.includes('worth')) {
    return 'A single lighthouse casting a steady beam over calm water at dusk.'
  }
  
  // Default fallback
  return 'A single lighthouse casting a steady beam over calm water at dusk.'
}

/**
 * Get conceptual scene from Gemini 1.5 Flash
 * @param title - Lesson or case study title
 * @param description - Lesson or case study description (optional)
 * @returns Conceptual scene description for use in Imagen prompt
 */
export async function getVisualMetaphor(
  title: string,
  description?: string
): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    // Use deterministic fallback if no API key
    return buildDeterministicMetaphor(title, description)
  }

  const prompt = `You are the Art Director for Harvard Business Review. Create a conceptual scene for a business lesson${description ? ` about: ${description}` : ''}.

**CRITICAL CONSTRAINTS:**
1. The scene must be a metaphor for the lesson's core idea.
2. The description must be concise (1-2 sentences) and visually descriptive.
3. It should involve real-world objects in a slightly surreal or symbolic arrangement.
4. DO NOT include the lesson title, lesson number, or any text references in your description.
5. DO NOT mention numbers, letters, or any textual elements.
6. AVOID scenes that commonly contain text: no signage, storefronts, screens, monitors, documents, books, magazines, newspapers, whiteboards, jerseys, uniforms, labels, or any objects that typically display text.
7. Favor abstract, geometric, or natural scenes: landscapes, architectural elements, objects in space, patterns, or symbolic arrangements that are purely visual.

**Your Task:** Provide ONLY the visual scene description. One sentence. No title, no numbers, no text references.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'text/plain',
            temperature: 0.6,
            maxOutputTokens: 60,
            candidateCount: 1,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`[getVisualMetaphor] Gemini API error: ${response.status}, using deterministic fallback`)
      return buildDeterministicMetaphor(title, description)
    }

    const data = await response.json()
    
    // Strict parse: only check candidates[0].content.parts[*].text
    let metaphor: string | undefined = undefined
    const candidate = data.candidates?.[0]
    
    if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          metaphor = part.text.trim()
          break
        }
      }
    }
    
    // If empty, retry with ultra-short prompt
    if (!metaphor) {
      const shortPrompt = `Visual metaphor for "${title}": One sentence symbolic scene. No text in image.`
      
      try {
        const retryResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: shortPrompt }] }],
              generationConfig: {
                responseMimeType: 'text/plain',
                temperature: 0.6,
                maxOutputTokens: 60,
              },
            }),
          }
        )
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json()
          const retryCandidate = retryData.candidates?.[0]
          if (retryCandidate?.content?.parts && Array.isArray(retryCandidate.content.parts)) {
            for (const part of retryCandidate.content.parts) {
              if (part.text) {
                metaphor = part.text.trim()
                break
              }
            }
          }
        }
      } catch (retryError) {
        // Fall through to deterministic
      }
    }
    
    // If still empty, use deterministic fallback
    if (!metaphor) {
      return buildDeterministicMetaphor(title, description)
    }

    // Clean up the response
    metaphor = metaphor.replace(/^["']|["']$/g, '')
    metaphor = metaphor.replace(/^\*\*|\*\*$/g, '')
    metaphor = metaphor.replace(/^`|`$/g, '')
    
    return metaphor.trim()
  } catch (error) {
    console.warn('[getVisualMetaphor] Error calling Gemini, using deterministic fallback:', error)
    return buildDeterministicMetaphor(title, description)
  }
}

/**
 * Build master prompt for Imagen 4
 * @param scene - Conceptual scene from Gemini
 * @returns Complete Imagen prompt with style constraints
 */
export function buildMasterPrompt(scene: string): string {
  return `[ART DIRECTION]
A professional editorial illustration for the cover of Harvard Business Review or The Economist. The composition must be clean, sophisticated, and symbolic.

[STYLE]
A modern, minimalist illustration with a subtle paper texture and fine grain. The style is a high-quality, flat-color screen print with clean, precise line work for details. The lighting is soft and directional.
- NO photorealism.
- NO glossy or plastic textures.
- NO generic "AI" look.

[PALETTE]
Strictly use this limited color palette:
- Background: Off-white paper (oklch(0.98 0.01 240)).
- Primary elements in deep navy blue (oklch(0.25 0.05 240)).
- Secondary elements in deep crimson red (oklch(0.4 0.1 25)).
- Highlights and accents in muted ochre (oklch(0.85 0.1 85)).

[SUBJECT]
Illustrate this scene: ${scene}.

[!!! CRITICAL: ABSOLUTELY NO TEXT !!!]
The image must contain ZERO text, letters, numbers, titles, labels, captions, or characters of any kind. This includes:
- NO lesson titles, lesson numbers (like "4.1"), words, phrases, letters (A-Z), numbers (0-9), or alphanumeric glyphs
- NO text overlays, labels, captions, subtitles, headings, or typography
- NO signage, logos, brandmarks, watermarks, signatures, or written text
- NO screens, monitors, displays, keyboards, or UI elements that might contain text
- NO books, magazines, newspapers, documents, papers with writing, or whiteboards
- NO jerseys, uniforms, name tags, or clothing with text
- NO storefronts, street signs, banners, or any objects that typically display text
- NO handwritten text, printed text, digital text, or text in any form
The image must be purely graphical, symbolic, and abstract. Use shapes, patterns, objects, and compositions that convey meaning without any textual elements. ANY TEXT, LETTER, NUMBER, OR CHARACTER IS A COMPLETE FAILURE.

[FORMAT]
Vertical aspect ratio, 2:3.`
}

/**
 * Get negative prompt for Imagen (separate parameter)
 * @returns Negative prompt string
 */
export function getNegativePrompt(): string {
  return 'photorealistic, 3D render, glossy, plastic, surrealism, text, words, letters, numbers, title, label, caption, signature, watermark, lesson number, subtitle, heading, typography, lettering, written text, printed text, digital text, handwritten text, alphanumeric, characters, glyphs, symbols that look like text, signage, logo, brandmark, storefront, street sign, banner, poster, screen, monitor, display, keyboard, UI text, on-screen text, book, magazine, newspaper, document, paper with writing, whiteboard, chalkboard, jersey, uniform, name tag, clothing with text, label, tag, sticker, badge, ticket, receipt, menu, sign, billboard, advertisement, cartoon, generic stock photo, cluttered, messy, ugly, low quality'
}

/**
 * Generate image using Imagen 4 via Replicate (using Node.js client library)
 * @param prompt - Complete Imagen prompt
 * @param negativePrompt - Negative prompt for constraints
 * @returns URL to generated image
 */
export async function generateImagenImage(
  prompt: string,
  negativePrompt: string
): Promise<string> {
  const replicateToken = process.env.REPLICATE_API_TOKEN

  if (!replicateToken) {
    throw new Error('REPLICATE_API_TOKEN not configured')
  }

  try {
    // Initialize Replicate client
    const replicate = new Replicate({
      auth: replicateToken,
    })

    // Prepare input according to Imagen 4 schema
    // Note: Check Replicate's model page for exact parameter names
    // Using aspect_ratio instead of width/height for better quality
    // Valid aspect ratios: "1:1", "9:16", "16:9", "3:4", "4:3"
    const input: any = {
      prompt: prompt,
      aspect_ratio: '3:4', // Vertical aspect ratio (portrait) - valid options are 3:4 or 9:16
      safety_filter_level: 'block_medium_and_above',
    }

    // Add negative prompt if the model supports it (check model schema)
    // Some Imagen models may use different parameter names
    if (negativePrompt) {
      // Try common parameter names - adjust based on actual model schema
      input.negative_prompt = negativePrompt
    }

    // Run the model - this handles polling automatically
    // According to Replicate docs: await replicate.run() returns output object
    const output = await replicate.run('google/imagen-4', { input })

    // Handle output according to Replicate documentation
    // Documentation shows: output.url() returns the URL string
    if (output && typeof output === 'object') {
      // Type assertion for output object with url method
      const outputWithUrl = output as { url?: (() => string) | string }
      if (typeof outputWithUrl.url === 'function') {
        // Use the .url() method as shown in documentation
        return outputWithUrl.url()
      } else if (typeof outputWithUrl.url === 'string') {
        // Direct URL property
        return outputWithUrl.url
      }
    }
    
    // Fallback: output might be a string URL directly
    if (typeof output === 'string') {
      return output
    }
    
    // Fallback: output might be an array of URLs
    if (Array.isArray(output) && output.length > 0) {
      const first = output[0]
      if (first && typeof first === 'object') {
        const firstWithUrl = first as { url?: (() => string) | string }
        if (typeof firstWithUrl.url === 'function') {
          return firstWithUrl.url()
        } else if (typeof firstWithUrl.url === 'string') {
          return firstWithUrl.url
        }
      } else if (typeof first === 'string') {
        return first
      }
    }
    
    throw new Error(`Unexpected output format from Replicate: ${JSON.stringify(output)}`)
  } catch (error) {
    console.error('Error generating Imagen image:', error)
    throw error
  }
}

// ============================================================================
// OLD REST API APPROACH (COMMENTED OUT - Using Node.js client instead)
// ============================================================================

/**
 * Helper function to poll for Replicate prediction results (COMMENTED OUT - Using Node.js client)
 */
// async function pollReplicatePrediction(predictionUrl: string, apiToken: string): Promise<string> {
//   const maxAttempts = 60 // 5 minutes max (5s intervals)
//   const pollInterval = 5000 // 5 seconds

//   for (let attempt = 0; attempt < maxAttempts; attempt++) {
//     const response = await fetch(predictionUrl, {
//       headers: {
//         'Authorization': `Token ${apiToken}`,
//         'Content-Type': 'application/json',
//       },
//     })

//     if (!response.ok) {
//       throw new Error(`Replicate API error: ${response.status}`)
//     }

//     const data = await response.json()
//     const status = data.status

//     if (status === 'succeeded') {
//       // Handle both array output and single string output
//       if (Array.isArray(data.output) && data.output.length > 0) {
//         return data.output[0]
//       } else if (typeof data.output === 'string' && data.output.length > 0) {
//         return data.output
//       }
//       throw new Error('Replicate prediction succeeded but no output URL found')
//     }

//     if (status === 'failed' || status === 'canceled') {
//       throw new Error(`Replicate prediction ${status}: ${data.error || 'Unknown error'}`)
//     }

//     // Status is 'starting' or 'processing', wait and retry
//     await new Promise(resolve => setTimeout(resolve, pollInterval))
//   }

//   throw new Error('Replicate prediction timed out after 5 minutes')
// }

// ============================================================================
// DALL-E 3 CODE (COMMENTED OUT - Using Imagen instead)
// ============================================================================

/**
 * Generate image using DALL-E 3 (COMMENTED OUT - using Imagen instead)
 * @param prompt - Complete DALL-E prompt
 * @param quality - 'hd' or 'standard' (default: 'hd')
 * @returns URL to generated image
 */
// export async function generateDalleImage(
//   prompt: string,
//   quality: 'hd' | 'standard' = 'hd'
// ): Promise<string> {
//   const openaiKey = process.env.OPENAI_API_KEY

//   if (!openaiKey) {
//     throw new Error('OPENAI_API_KEY not configured')
//   }

//   try {
//     const response = await fetch('https://api.openai.com/v1/images/generations', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${openaiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'dall-e-3',
//         prompt: prompt,
//         n: 1,
//         size: '1024x1792', // Vertical HD aspect ratio
//         quality: quality,
//       }),
//     })

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}))
//       throw new Error(
//         `DALL-E API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`
//       )
//     }

//     const data = await response.json()
//     const imageUrl = data.data?.[0]?.url

//     if (!imageUrl) {
//       throw new Error('No image URL returned from DALL-E')
//     }

//     return imageUrl
//   } catch (error) {
//     console.error('Error generating DALL-E image:', error)
//     throw error
//   }
// }

/**
 * Complete two-stage pipeline: Get conceptual scene and generate image using Imagen
 * @param title - Lesson or case title
 * @param description - Optional description
 * @returns URL to generated Imagen image
 */
export async function generateImagenThumbnail(
  title: string,
  description?: string
): Promise<string> {
  const scene = await getVisualMetaphor(title, description)
  const prompt = buildMasterPrompt(scene)
  const negativePrompt = getNegativePrompt()
  const imageUrl = await generateImagenImage(prompt, negativePrompt)
  return imageUrl
}


