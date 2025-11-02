import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resvg } from 'https://esm.sh/@resvg/resvg-js@2.6.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import satori from 'https://esm.sh/satori@0.10.9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Import React for JSX (Deno compatible)
const React = {
  createElement: (type: any, props: any, ...children: any[]) => ({
    type,
    props: { ...props, children: children.flat() },
  }),
}

// Thumbnail React Components (simplified for Deno)
function LessonThumbnail({ title, domainName, iconSvgPath, duration, difficulty }: any) {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        padding: '40px',
        backgroundColor: 'oklch(0.98 0.01 240)',
        color: 'oklch(0.15 0.02 240)',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    },
    // Header
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '24px',
          color: 'oklch(0.6 0.01 240)',
          fontWeight: 500,
          marginBottom: '40px',
        },
      },
      React.createElement('span', null, 'Execemy Program'),
      React.createElement('span', null, domainName)
    ),
    // Main Content
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexGrow: 1,
          alignItems: 'center',
          gap: '40px',
        },
      },
      // Icon - embed as SVG data URI in img tag
      React.createElement(
        'div',
        {
          style: {
            width: '33%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.15,
          },
        },
        React.createElement('img', {
          src: `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="oklch(0.5 0.2 260)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconSvgPath}</svg>`)}`,
          width: 200,
          height: 200,
        })
      ),
      // Title
      React.createElement(
        'div',
        {
          style: {
            width: '67%',
            paddingLeft: '40px',
          },
        },
        React.createElement('h1', {
          style: {
            fontSize: '72px',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-2px',
            color: 'oklch(0.15 0.02 240)',
            margin: 0,
          },
        }, title)
      )
    ),
    // Footer
    React.createElement(
      'div',
      {
        style: {
          borderTop: '2px solid oklch(0.5 0.2 260)',
          paddingTop: '20px',
          display: 'flex',
          gap: '24px',
          fontSize: '24px',
          color: 'oklch(0.6 0.01 240)',
          fontWeight: 500,
        },
      },
      React.createElement('span', null, 'Lesson'),
      React.createElement('span', null, duration),
      React.createElement('span', null, difficulty)
    )
  )
}

function CaseStudyThumbnail({ title, domainName, dataVizSvg, duration, difficulty }: any) {
  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        padding: '40px',
        backgroundColor: 'oklch(0.98 0.01 240)',
        color: 'oklch(0.15 0.02 240)',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      },
    },
    // Dot grid background
    React.createElement('svg', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.3,
        pointerEvents: 'none',
      },
    },
      React.createElement('defs', null,
        React.createElement('pattern', {
          id: 'dot-grid',
          x: 0,
          y: 0,
          width: 20,
          height: 20,
          patternUnits: 'userSpaceOnUse',
        },
          React.createElement('circle', {
            cx: 2,
            cy: 2,
            r: 1,
            fill: 'oklch(0.6 0.01 240)',
            opacity: 0.1,
          })
        )
      ),
      React.createElement('rect', {
        width: '100%',
        height: '100%',
        fill: 'url(#dot-grid)',
      })
    ),
    // Header
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '24px',
          color: 'oklch(0.6 0.01 240)',
          fontWeight: 500,
          marginBottom: '40px',
          position: 'relative',
          zIndex: 1,
        },
      },
      React.createElement('span', null, 'Execemy Program'),
      React.createElement('span', null, domainName)
    ),
    // Main Content
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
      },
      // AI SVG background - use img tag with data URI
      React.createElement('img', {
        src: `data:image/svg+xml,${encodeURIComponent(dataVizSvg)}`,
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: 0.2,
          zIndex: 0,
        },
      }),
      // Title
      React.createElement('h1', {
        style: {
          fontSize: '72px',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-2px',
          textAlign: 'center',
          width: '100%',
          color: 'oklch(0.15 0.02 240)',
          margin: 0,
          position: 'relative',
          zIndex: 1,
        },
      }, title)
    ),
    // Footer
    React.createElement(
      'div',
      {
        style: {
          borderTop: '2px solid oklch(0.5 0.2 260)',
          paddingTop: '20px',
          display: 'flex',
          gap: '24px',
          fontSize: '24px',
          color: 'oklch(0.6 0.01 240)',
          fontWeight: 500,
          position: 'relative',
          zIndex: 1,
        },
      },
      React.createElement('span', null, 'Case Study'),
      React.createElement('span', null, duration),
      React.createElement('span', null, difficulty)
    )
  )
}

// Lucide icon paths
const LUCIDE_ICON_PATHS: Record<string, string> = {
  DollarSign: `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />`,
  Target: `<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />`,
  TrendingUp: `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />`,
  Shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`,
  Users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />`,
  BookOpen: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />`,
}

function getLucideIconPath(iconName: string): string {
  return LUCIDE_ICON_PATHS[iconName] || LUCIDE_ICON_PATHS.BookOpen
}

// Map competency to icon
function getIconForCompetency(competencyName: string): string {
  const lower = competencyName.toLowerCase()
  if (lower.includes('financial')) return 'DollarSign'
  if (lower.includes('strategic')) return 'Target'
  if (lower.includes('market')) return 'TrendingUp'
  if (lower.includes('risk')) return 'Shield'
  if (lower.includes('leadership')) return 'Users'
  return 'BookOpen'
}

// Call Gemini for data visualization SVG
async function callGeminiForDataViz(
  title: string,
  domainName: string,
  geminiApiKey: string
): Promise<string> {
  const systemPrompt = `You are a minimalist data visualization designer creating abstract SVG graphics for an executive education platform. Your style is clean, professional, and symbolic, like a chart in The Economist but without text or axes.

Your task is to generate a single, valid SVG string based on the provided business concept.

--- CONSTRAINTS (NON-NEGOTIABLE) ---
1. Canvas: The SVG must have width="400", height="300", and viewBox="0 0 400 300".
2. No Text: The SVG must contain ZERO <text> elements. It must be purely visual.
3. Colors:
   - Use stroke="oklch(0.5 0.2 260)" for all primary lines and outlines.
   - Use fill="oklch(0.8 0.01 240)" or stroke="oklch(0.8 0.01 240)" for secondary or background elements.
   - Use fill="none" for most shapes unless a fill is specified.
4. Strokes: Use stroke-width of 1, 2, or 4. Use stroke-linecap="round" and stroke-linejoin="round".

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

--- YOUR TASK ---
Generate only the SVG code. Start with <svg ...> and end with </svg>. Do not include any other text, explanation, or markdown.`

  const userPrompt = `Business Concept: ${title}
Domain: ${domainName}

Generate the SVG visualization now.`

  async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt === maxRetries) throw lastError
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw lastError || new Error('Retry exhausted')
  }

  const response = await retryWithBackoff(async () => {
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, { text: userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    )

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      throw new Error(`Gemini API failed: ${apiResponse.status} - ${errorText}`)
    }

    return apiResponse
  })

  const data = await response.json()
  let rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawResponse) throw new Error('No response from Gemini')

  rawResponse = rawResponse.trim()
  if (rawResponse.startsWith('```')) {
    const lines = rawResponse.split('\n')
    lines.shift()
    if (lines[lines.length - 1].trim() === '```') lines.pop()
    rawResponse = lines.join('\n').trim()
  }

  const svgMatch = rawResponse.match(/<svg[\s\S]*?<\/svg>/i)
  let svg = svgMatch ? svgMatch[0] : rawResponse

  // CRITICAL: Remove ALL text elements per "Execemy Clarity" design system
  svg = svg.replace(/<text[\s\S]*?<\/text>/gi, '')
  svg = svg.replace(/<tspan[\s\S]*?<\/tspan>/gi, '')
  svg = svg.replace(/\s+xml:space\s*=\s*["']preserve["']/gi, '')
  
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
    if (num <= 1.5) return 'stroke-width="1"'
    if (num <= 3) return 'stroke-width="2"'
    return 'stroke-width="4"'
  })
  
  svg = svg.replace(/\s+class\s*=\s*["'][^"']*["']/gi, '')
  
  // Final validation
  if (svg.includes('<text') || svg.includes('</text>')) {
    throw new Error('Generated SVG still contains text elements')
  }
  
  if (!svg.includes('width="400"') || !svg.includes('height="300"') || !svg.includes('viewBox="0 0 400 300"')) {
    svg = svg.replace(/<svg\s+([^>]*)>/i, '<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" $1>')
    svg = svg.replace(/viewBox\s*=\s*["'][^"']*["']/gi, 'viewBox="0 0 400 300"')
  }

  return svg
}

// Load Inter font (TTF format for resvg compatibility)
async function loadInterFont(weight: 400 | 500 | 700 = 400): Promise<ArrayBuffer> {
  const weightMap: Record<number, string> = { 
    400: 'Regular',
    500: 'Medium', 
    700: 'Bold' 
  }
  
  // Use fonts.googleapis.com direct TTF URLs
  // Inter font family IDs from Google Fonts
  const fontUrls: Record<number, string> = {
    400: 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf',
    500: 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.ttf',
    700: 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.ttf',
  }
  
  try {
    const url = fontUrls[weight]
    const response = await fetch(url)
    if (!response.ok) {
      // Fallback: try Google Fonts CSS and extract TTF URL
      console.warn(`Direct font fetch failed, trying alternative for weight ${weight}`)
      // Alternative: use a CDN that serves TTF files
      const altUrl = `https://cdn.jsdelivr.net/gh/rsms/inter@master/docs/font-files/Inter-${weightMap[weight]}.ttf`
      const altResponse = await fetch(altUrl)
      if (!altResponse.ok) throw new Error(`Font fetch failed: ${altResponse.statusText}`)
      return await altResponse.arrayBuffer()
    }
    return await response.arrayBuffer()
  } catch (error) {
    console.error('Font load error:', error)
    throw new Error(`Unable to load Inter ${weightMap[weight]} font`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contentId, contentType } = await req.json()

    if (!contentId || !contentType) {
      return new Response(
        JSON.stringify({ error: 'Missing contentId or contentType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (contentType !== 'lesson' && contentType !== 'case') {
      return new Response(
        JSON.stringify({ error: 'contentType must be "lesson" or "case"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    let title: string
    let domainName: string
    let iconSvgPath: string = ''
    let dataVizSvg: string = ''
    let duration: string
    let difficulty: string
    let metadata: any

    if (contentType === 'lesson') {
      // Fetch article with competency
      const { data: article, error: articleError } = await supabaseServiceClient
        .from('articles')
        .select('title, metadata, competency:competencies(name)')
        .eq('id', contentId)
        .single()

      if (articleError || !article) {
        return new Response(
          JSON.stringify({ error: 'Article not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      title = article.title
      metadata = article.metadata || {}
      const competencyName = article.competency?.name || ''

      // Map competency to domain and icon
      const iconName = getIconForCompetency(competencyName)
      iconSvgPath = getLucideIconPath(iconName)

      // Get domain name from competency
      const domainMapping: Record<string, string> = {
        'financial': 'Financial Acumen',
        'strategic': 'Strategic Thinking',
        'market': 'Market Awareness',
        'risk': 'Risk Management',
        'leadership': 'Leadership Judgment',
      }
      
      domainName = Object.entries(domainMapping).find(([key]) => 
        competencyName.toLowerCase().includes(key)
      )?.[1] || competencyName || 'Business Strategy'

      duration = metadata.duration || metadata.estimatedMinutes 
        ? `${metadata.estimatedMinutes || metadata.duration} min read`
        : '12 min read'
      difficulty = metadata.difficulty || 'Advanced'

    } else {
      // Fetch case with competencies
      const { data: caseData, error: caseError } = await supabaseServiceClient
        .from('cases')
        .select(`
          title,
          metadata,
          competencies:case_competencies(
            competency:competencies(name)
          )
        `)
        .eq('id', contentId)
        .single()

      if (caseError || !caseData) {
        return new Response(
          JSON.stringify({ error: 'Case not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      title = caseData.title
      metadata = caseData.metadata || {}
      const competencyName = caseData.competencies?.[0]?.competency?.name || ''

      // Get domain name
      const domainMapping: Record<string, string> = {
        'financial': 'Financial Acumen',
        'strategic': 'Strategic Thinking',
        'market': 'Market Awareness',
        'risk': 'Risk Management',
        'leadership': 'Leadership Judgment',
      }
      
      domainName = Object.entries(domainMapping).find(([key]) => 
        competencyName.toLowerCase().includes(key)
      )?.[1] || competencyName || 'Business Strategy'

      // Generate AI SVG
      const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
      if (!GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        dataVizSvg = await callGeminiForDataViz(title, domainName, GEMINI_API_KEY)
      } catch (geminiError) {
        console.error('Gemini error:', geminiError)
        // Use fallback SVG following Execemy Clarity design system
        dataVizSvg = `<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="150" r="80" fill="oklch(0.8 0.01 240)" stroke="oklch(0.5 0.2 260)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="100" y1="150" x2="300" y2="150" stroke="oklch(0.5 0.2 260)" stroke-width="2" stroke-linecap="round"/>
          <line x1="200" y1="70" x2="200" y2="230" stroke="oklch(0.5 0.2 260)" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      }

      duration = metadata.duration || metadata.estimatedMinutes
        ? `${metadata.estimatedMinutes || metadata.duration} min sim`
        : '90 min sim'
      difficulty = metadata.difficulty || 'Advanced'
    }

    // Load Inter fonts
    const fontBold = await loadInterFont(700)
    const fontMedium = await loadInterFont(500)
    const fontRegular = await loadInterFont(400)

    // Render component with satori
    const component = contentType === 'lesson'
      ? LessonThumbnail({ title, domainName, iconSvgPath, duration, difficulty })
      : CaseStudyThumbnail({ title, domainName, dataVizSvg, duration, difficulty })

    const svg = await satori(component, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
        { name: 'Inter', data: fontMedium, weight: 500, style: 'normal' },
        { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
      ],
    })

    // Convert SVG to PNG
    const resvg = new Resvg(svg, {
      font: {
        loadSystemFonts: false,
      },
    })
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    // Upload to Supabase Storage
    const filePath = `thumbnails/${contentId}.png`
    const { error: uploadError } = await supabaseServiceClient.storage
      .from('assets')
      .upload(filePath, pngBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload thumbnail', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseServiceClient.storage
      .from('assets')
      .getPublicUrl(filePath)

    // Update DB with thumbnail_url
    const tableName = contentType === 'lesson' ? 'articles' : 'cases'
    const { error: updateError } = await supabaseServiceClient
      .from(tableName)
      .update({ thumbnail_url: publicUrl })
      .eq('id', contentId)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update thumbnail_url', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate thumbnail', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

