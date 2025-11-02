/**
 * Script to generate thumbnails and display them as SVG previews
 * This generates the thumbnails and shows the SVG output before PNG conversion
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function generateThumbnailSVG(contentId: string, contentType: 'lesson' | 'case') {
  console.log(`\n🖼️  Generating thumbnail SVG for ${contentType} ${contentId}...`)

  const functionUrl = `${supabaseUrl}/functions/v1/generate-thumbnail`

  try {
    // First, generate the thumbnail (this creates PNG and returns URL)
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        contentId,
        contentType,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ Thumbnail generated: ${result.url}`)
    
    // Fetch the PNG and convert to data URI for display
    const imageResponse = await fetch(result.url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imageResponse.statusText}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const dataUri = `data:image/png;base64,${base64}`
    
    return {
      url: result.url,
      dataUri,
      contentId,
      contentType,
    }
  } catch (error) {
    console.error(`❌ Error generating thumbnail:`, error)
    throw error
  }
}

async function main() {
  console.log('🚀 Generating thumbnails and creating preview...\n')

  try {
    // Get content items - try without status filter first to get any items
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, status')
      .limit(2)
      .order('created_at', { ascending: true })

    if (articlesError) {
      console.error('❌ Error fetching articles:', articlesError)
      process.exit(1)
    }

    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('id, title, status')
      .limit(1)
      .order('created_at', { ascending: true })

    if (casesError) {
      console.error('❌ Error fetching cases:', casesError)
      process.exit(1)
    }

    if ((!articles || articles.length === 0) && (!cases || cases.length === 0)) {
      console.error('❌ No content found in database')
      process.exit(1)
    }

    const results: Array<{ type: string; id: string; title: string; dataUri: string; url: string }> = []

    console.log(`📋 Found ${articles?.length || 0} article(s) and ${cases?.length || 0} case(s)\n`)

    // Generate first lesson thumbnail
    if (articles && articles.length > 0) {
      console.log(`📚 Article 1: ${articles[0].title}`)
      const result1 = await generateThumbnailSVG(articles[0].id, 'lesson')
      results.push({ 
        type: 'lesson', 
        id: articles[0].id, 
        title: articles[0].title, 
        dataUri: result1.dataUri,
        url: result1.url
      })
    }

    // Generate second lesson thumbnail
    if (articles && articles.length > 1) {
      console.log(`📚 Article 2: ${articles[1].title}`)
      const result2 = await generateThumbnailSVG(articles[1].id, 'lesson')
      results.push({ 
        type: 'lesson', 
        id: articles[1].id, 
        title: articles[1].title, 
        dataUri: result2.dataUri,
        url: result2.url
      })
    } else if (cases && cases.length > 0) {
      // If only one article, use first case
      console.log(`📊 Case Study: ${cases[0].title}`)
      const result3 = await generateThumbnailSVG(cases[0].id, 'case')
      results.push({ 
        type: 'case', 
        id: cases[0].id, 
        title: cases[0].title, 
        dataUri: result3.dataUri,
        url: result3.url
      })
    }

    // Generate case study thumbnail if we have cases and haven't used it yet
    if (cases && cases.length > 0 && (articles?.length || 0) >= 2) {
      console.log(`📊 Case Study: ${cases[0].title}`)
      const result3 = await generateThumbnailSVG(cases[0].id, 'case')
      results.push({ 
        type: 'case', 
        id: cases[0].id, 
        title: cases[0].title, 
        dataUri: result3.dataUri,
        url: result3.url
      })
    }

    // Create HTML preview file
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Thumbnail Preview</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 30px;
    }
    .thumbnail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }
    .thumbnail-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .thumbnail-card h2 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #666;
    }
    .thumbnail-card img {
      width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .info {
      margin-top: 15px;
      font-size: 12px;
      color: #999;
    }
    .info code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Generated Thumbnails Preview</h1>
    <div class="thumbnail-grid">
      ${results.map((result, index) => `
        <div class="thumbnail-card">
          <h2>${index + 1}. ${result.type === 'lesson' ? '📚 Lesson' : '📊 Case Study'}</h2>
          <img src="${result.dataUri}" alt="${result.title}" />
          <div class="info">
            <div><strong>Title:</strong> ${result.title}</div>
            <div><strong>URL:</strong> <code>${result.url}</code></div>
            <div><strong>ID:</strong> <code>${result.id}</code></div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`

    const outputPath = path.join(process.cwd(), 'thumbnail-preview.html')
    fs.writeFileSync(outputPath, htmlContent)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ Thumbnail Generation Complete!')
    console.log('='.repeat(60))
    console.log('\nGenerated thumbnails:')
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.type === 'lesson' ? '📚 Lesson' : '📊 Case Study'}`)
      console.log(`   Title: ${result.title}`)
      console.log(`   URL: ${result.url}`)
    })
    console.log(`\n📄 Preview file created: ${outputPath}`)
    console.log(`   Open this file in your browser to view all thumbnails`)
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main()

