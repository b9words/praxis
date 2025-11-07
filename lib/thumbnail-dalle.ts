/**
 * Imagen Thumbnail Generation Helper Functions
 * Two-stage AI pipeline: Gemini 2.5 Flash for conceptual scenes, Google Imagen 4 (via Replicate) for image generation
 */

import Replicate from 'replicate'

/**
 * Get conceptual scene from Gemini 2.5 Flash
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
    throw new Error('GEMINI_API_KEY not configured')
  }

  const prompt = `You are the Art Director for Harvard Business Review. Create a conceptual scene for a business lesson${description ? ` about: ${description}` : ''}.

**CRITICAL CONSTRAINTS:**
1. The scene must be a metaphor for the lesson's core idea.
2. The description must be concise (2-3 sentences) and visually descriptive.
3. It should involve real-world objects in a slightly surreal or symbolic arrangement.
4. DO NOT include the lesson title, lesson number, or any text references in your description.
5. DO NOT mention numbers, letters, or any textual elements.

**Example:** For 'Second-Order Decision Making,' a good scene would be: 'A top-down view of a single, large ship navigating a calm sea. However, its wake is creating massive, unexpected waves that are rocking a series of smaller boats far behind it.'

**Your Task:** Provide ONLY the visual scene description. No title, no numbers, no text references.`


  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`,
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
            temperature: 0.8,
            maxOutputTokens: 150,
            topP: 0.95,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Try multiple response structure paths
    let metaphor: string | undefined = undefined
    
    // Path 1: Standard structure
    metaphor = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    
    // Path 2: Alternative structure (some Gemini versions)
    if (!metaphor && data.candidates?.[0]?.output) {
      metaphor = data.candidates[0].output.trim()
    }
    
    // Path 3: Direct text response
    if (!metaphor && data.text) {
      metaphor = data.text.trim()
    }
    
    // Path 4: Check all candidates and parts
    if (!metaphor && data.candidates) {
      for (const candidate of data.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              metaphor = part.text.trim()
              break
            }
          }
        }
        if (metaphor) break
      }
    }
    
    // Debug logging if we can't find the response
    if (!metaphor) {
      console.error('Gemini response structure:', JSON.stringify(data, null, 2))
      // Fallback to generic conceptual scene instead of throwing
      console.warn('No metaphor found in Gemini response, using fallback')
      return `A symbolic scene representing ${description || title.toLowerCase()}, with real-world objects arranged in a meaningful, metaphorical composition`
    }

    // Clean up the response - remove quotes if present, remove markdown formatting
    metaphor = metaphor.replace(/^["']|["']$/g, '') // Remove quotes
    metaphor = metaphor.replace(/^\*\*|\*\*$/g, '') // Remove markdown bold
    metaphor = metaphor.replace(/^`|`$/g, '') // Remove code backticks
    
    return metaphor.trim()
  } catch (error) {
    console.error('Error getting visual metaphor from Gemini:', error)
    
    // Fallback to generic conceptual scene
    return `A symbolic scene representing ${description || title.toLowerCase()}, with real-world objects arranged in a meaningful, metaphorical composition`
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
- NO lesson titles
- NO lesson numbers (like "4.1")
- NO words or phrases
- NO letters or numbers
- NO text overlays
- NO labels or captions
The image must be purely graphical and symbolic. ANY TEXT IS A COMPLETE FAILURE.

[FORMAT]
Vertical aspect ratio, 2:3.`
}

/**
 * Get negative prompt for Imagen (separate parameter)
 * @returns Negative prompt string
 */
export function getNegativePrompt(): string {
  return 'photorealistic, 3D render, glossy, plastic, surrealism, text, words, letters, numbers, title, label, caption, signature, watermark, lesson number, subtitle, heading, typography, lettering, written text, printed text, cartoon, generic stock photo, cluttered, messy, ugly, low quality'
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


