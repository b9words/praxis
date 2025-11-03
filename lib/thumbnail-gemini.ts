/**
 * Gemini API integration for generating abstract SVG data visualizations
 * Used by thumbnail generation system for case study thumbnails
 */

/**
 * Call Gemini 2.5 Flash to generate an abstract SVG data visualization
 * Following the "Execemy Clarity" design system (viewBox 400x300, strict color palette)
 * @param title - The case study title
 * @param domainName - The domain name (e.g., "Mastery of Capital Allocation")
 * @param geminiApiKey - Gemini API key from environment
 * @returns SVG string representing the abstract visualization
 */
export async function callGeminiForDataViz(
  title: string,
  domainName: string,
  geminiApiKey: string
): Promise<string> {
  const systemPrompt = `You are generating a PURELY VISUAL abstract SVG - NO TEXT, NO WORDS, NO LABELS, NO NUMBERS, NO TEXT ELEMENTS AT ALL.

This SVG will be used as a background visualization. It must be completely abstract and symbolic.

--- ABSOLUTE REQUIREMENTS (FOLLOW EXACTLY) ---

1. CANVAS: 
   <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
   DO NOT CHANGE THESE VALUES.

2. ZERO TEXT - STRICTLY FORBIDDEN:
   - NO <text> elements
   - NO <tspan> elements  
   - NO text attributes
   - NO words, numbers, or labels
   - PURELY geometric shapes: <path>, <rect>, <circle>, <line>, <polygon>, <polyline>

3. COLORS (ONLY THESE TWO):
   - stroke="oklch(0.5 0.2 260)" OR fill="oklch(0.5 0.2 260)" (primary blue)
   - stroke="oklch(0.8 0.01 240)" OR fill="oklch(0.8 0.01 240)" (secondary gray)
   - fill="none" for most paths/lines
   - NO other colors, gradients, or opacity

4. STROKES:
   - stroke-width MUST be exactly: 1, 2, or 4
   - stroke-linecap="round" on ALL paths and lines
   - stroke-linejoin="round" on ALL paths

5. BOUNDS:
   - ALL coordinates: x/y must be 0-400, y must be 0-300
   - Rectangles: ensure x+width ≤ 400, y+height ≤ 300
   - Circles: ensure cx±r and cy±r stay within bounds

--- VISUAL LEXICON (YOUR TOOLS) ---
You should build your design using these primitives:
- <path>: For trends, flows, and connections.
- <rect>: For bars, blocks, and structure.
- <circle>: For nodes, focal points, and entities.
- <line>: For grid lines and simple connectors.

--- CONCEPTUAL GUIDANCE ---
- For "growth" or "improvement," use upward-trending lines or increasing bar sizes.
- For "systems" or "networks," use interconnected nodes (circles) and paths.
- For "competition" or "trade-offs," use two opposing or intersecting visual elements.
- For "risk" or "uncertainty," use dashed lines (stroke-dasharray="4 4") or diverging paths.
- For "focus" or "priority," highlight one element with a thicker stroke or a surrounding shape.

--- OUTPUT FORMAT ---
Output ONLY the raw SVG element. NO markdown code blocks. NO explanations. NO text elements.
Start exactly with: <svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
End exactly with: </svg>
The entire content between <svg> and </svg> must be ONLY geometric shapes - paths, rectangles, circles, lines. NO TEXT.`

  const userPrompt = `Business Concept: ${title}
Domain: ${domainName}

Generate the SVG visualization now.`

  // Retry helper with exponential backoff
  async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt === maxRetries) throw lastError
        
        const delay = Math.min(initialDelay * Math.pow(2, attempt), 8000)
        await new Promise(resolve => setTimeout(resolve, delay))
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
      }
    }
    throw lastError || new Error('Retry exhausted')
  }

  const response = await retryWithBackoff(async () => {
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            topP: 0.95,
          }
        }),
      }
    )

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      const error = new Error(`Gemini API request failed: ${apiResponse.status} - ${errorText}`)
      ;(error as any).status = apiResponse.status
      throw error
    }

    return apiResponse
  })

  const data = await response.json()
  let rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawResponse) {
    throw new Error('No response from Gemini API')
  }

  // Clean up the response - remove markdown code blocks if present
  rawResponse = rawResponse.trim()
  
  // Remove markdown code blocks
  if (rawResponse.startsWith('```')) {
    const lines = rawResponse.split('\n')
    lines.shift() // Remove first line (```svg or ```)
    if (lines[lines.length - 1].trim() === '```') {
      lines.pop() // Remove last line (```)
    }
    rawResponse = lines.join('\n').trim()
  }

  // Validate it's an SVG
  if (!rawResponse.includes('<svg')) {
    throw new Error('Gemini response does not contain valid SVG')
  }

  // Extract just the SVG element
  const svgMatch = rawResponse.match(/<svg[\s\S]*?<\/svg>/i)
  let svg = svgMatch ? svgMatch[0] : rawResponse

  // CRITICAL: Remove ALL text elements per "Execemy Clarity" design system
  // Remove text elements (including nested content)
  let previousSvg = ''
  while (svg !== previousSvg) {
    previousSvg = svg
    svg = svg.replace(/<text[^>]*>[\s\S]*?<\/text>/gi, '')
    svg = svg.replace(/<text[^>]*\/>/gi, '')
  }
  svg = svg.replace(/<tspan[\s\S]*?<\/tspan>/gi, '')
  svg = svg.replace(/<tspan[^>]*\/>/gi, '')
  svg = svg.replace(/\s+xml:space\s*=\s*["']preserve["']/gi, '')
  svg = svg.replace(/\s+text-anchor\s*=\s*["'][^"']*["']/gi, '')
  svg = svg.replace(/\s+font-family\s*=\s*["'][^"']*["']/gi, '')
  svg = svg.replace(/\s+font-size\s*=\s*["'][^"']*["']/gi, '')
  svg = svg.replace(/\s+font-weight\s*=\s*["'][^"']*["']/gi, '')
  
  // Fix viewBox - MUST be "0 0 400 300"
  svg = svg.replace(/viewBox\s*=\s*["'][^"']*["']/gi, 'viewBox="0 0 400 300"')
  if (!svg.includes('viewBox="0 0 400 300"')) {
    svg = svg.replace(/<svg\s+([^>]*)>/i, '<svg $1 viewBox="0 0 400 300">')
  }
  
  // Fix width and height - MUST be 400x300
  svg = svg.replace(/width\s*=\s*["'][^"']*["']/gi, 'width="400"')
  svg = svg.replace(/height\s*=\s*["'][^"']*["']/gi, 'height="300"')
  
  // Fix invalid rect dimensions - ensure all rects fit within 400x300 bounds
  svg = svg.replace(/<rect\s+([^>]*)>/gi, (match: string, attrs: string) => {
    const xMatch = attrs.match(/x\s*=\s*["'](\d+(?:\.\d+)?)["']/)
    const yMatch = attrs.match(/y\s*=\s*["'](\d+(?:\.\d+)?)["']/)
    const widthMatch = attrs.match(/width\s*=\s*["'](\d+(?:\.\d+)?)["']/)
    const heightMatch = attrs.match(/height\s*=\s*["'](\d+(?:\.\d+)?)["']/)
    
    let fixed = attrs
    if (xMatch && widthMatch) {
      const x = parseFloat(xMatch[1])
      const width = parseFloat(widthMatch[1])
      if (x + width > 400) {
        const newWidth = Math.max(10, Math.min(400 - x, width))
        fixed = fixed.replace(/width\s*=\s*["'](\d+(?:\.\d+)?)["']/, `width="${newWidth}"`)
      }
    }
    if (yMatch && heightMatch) {
      const y = parseFloat(yMatch[1])
      const height = parseFloat(heightMatch[1])
      if (y + height > 300) {
        const newHeight = Math.max(10, Math.min(300 - y, height))
        fixed = fixed.replace(/height\s*=\s*["'](\d+(?:\.\d+)?)["']/, `height="${newHeight}"`)
      }
    }
    return `<rect ${fixed}>`
  })
  
  // Fix invalid stroke-width values (must be 1, 2, or 4)
  svg = svg.replace(/stroke-width\s*=\s*["'](\d+(?:\.\d+)?)["']/gi, (match: string, value: string) => {
    const num = parseFloat(value)
    if (num === 1 || num === 2 || num === 4) return match
    // Round to nearest allowed value
    if (num <= 1.5) return 'stroke-width="1"'
    if (num <= 3) return 'stroke-width="2"'
    return 'stroke-width="4"'
  })
  
  // Remove any elements that reference undefined IDs or invalid attributes
  svg = svg.replace(/\s+class\s*=\s*["'][^"']*["']/gi, '') // Remove class references (not needed in inline SVG)
  
  // Final validation: ensure no text remains
  if (svg.includes('<text') || svg.includes('</text>')) {
    throw new Error('Generated SVG still contains text elements - this violates the design system')
  }
  
  // Final validation: ensure correct dimensions
  if (!svg.includes('width="400"') || !svg.includes('height="300"') || !svg.includes('viewBox="0 0 400 300"')) {
    console.warn('⚠️ Generated SVG does not have correct dimensions, fixing...')
    svg = svg.replace(/<svg\s+([^>]*)>/i, '<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" $1>')
    svg = svg.replace(/viewBox\s*=\s*["'][^"']*["']/gi, 'viewBox="0 0 400 300"')
  }

  return svg
}

