/**
 * Direct thumbnail generation from curriculum data
 * Generates 3 thumbnails and creates an HTML preview
 */

import { getAllLessonsFlat, getDomainById } from '../lib/curriculum-data'
import { getAllInteractiveSimulations } from '../lib/case-study-loader'
import { LessonThumbnail } from '../components/thumbnails/LessonThumbnail'
import { CaseStudyThumbnail } from '../components/thumbnails/CaseStudyThumbnail'
import { getLucideIconPath } from '../lib/thumbnail-utils'
import { callGeminiForDataViz } from '../lib/thumbnail-gemini'
import { config } from 'dotenv'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import * as fs from 'fs'
import * as path from 'path'

config({ path: '.env.local' })

// Load Inter fonts - try multiple sources
async function loadInterFont(weight: 400 | 500 | 700 = 400): Promise<ArrayBuffer> {
  const weightMap: Record<number, string> = { 
    400: 'Regular',
    500: 'Medium', 
    700: 'Bold' 
  }
  
  // Try multiple CDN sources
  const fontSources = [
    `https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2`,
    `https://cdn.jsdelivr.net/gh/rsms/inter@latest/docs/font-files/Inter-${weightMap[weight]}.woff2`,
    `https://github.com/rsms/inter/raw/master/docs/font-files/Inter-${weightMap[weight]}.woff2`,
  ]
  
  // Try local fonts directory first
  const localPath = path.join(process.cwd(), 'fonts', `Inter-${weightMap[weight]}.ttf`)
  if (fs.existsSync(localPath)) {
    try {
      return fs.readFileSync(localPath).buffer
    } catch (error) {
      console.warn(`Failed to read local font: ${localPath}`)
    }
  }
  
  // Fallback: Try CDN sources
  const ttfUrls = [
    `https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-${weightMap[weight]}.ttf`,
    `https://cdn.jsdelivr.net/gh/rsms/inter@master/docs/font-files/Inter-${weightMap[weight]}.ttf`,
  ]
  
  for (const url of ttfUrls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      })
      if (response.ok && response.status === 200) {
        const buffer = await response.arrayBuffer()
        if (buffer.byteLength > 0) {
          // Save to local fonts directory for future use
          const fontsDir = path.join(process.cwd(), 'fonts')
          if (!fs.existsSync(fontsDir)) {
            fs.mkdirSync(fontsDir, { recursive: true })
          }
          fs.writeFileSync(localPath, Buffer.from(buffer))
          return buffer
        }
      }
    } catch (error) {
      continue
    }
  }
  
  throw new Error(`Unable to load Inter ${weightMap[weight]} font from any source`)
}

function getIconForCompetency(domainTitle: string): string {
  const lower = domainTitle.toLowerCase()
  if (lower.includes('capital') || lower.includes('financial')) return 'DollarSign'
  if (lower.includes('competitive') || lower.includes('strategic')) return 'Target'
  if (lower.includes('market') || lower.includes('foresight')) return 'TrendingUp'
  if (lower.includes('crisis') || lower.includes('risk')) return 'Shield'
  if (lower.includes('organizational') || lower.includes('leadership')) return 'Users'
  return 'BookOpen'
}

async function generateThumbnailSVG(
  title: string,
  domainName: string,
  iconName: string,
  contentType: 'lesson' | 'case',
  competencyName?: string
): Promise<string> {
  // Load fonts
  const fontRegular = await loadInterFont(400)
  const fontMedium = await loadInterFont(500)
  const fontBold = await loadInterFont(700)

  let component: any
  
  if (contentType === 'lesson') {
    const iconSvgPath = getLucideIconPath(iconName)
    component = LessonThumbnail({
      title,
      domainName,
      iconSvgPath,
      duration: '12 min read',
      difficulty: 'Advanced',
    })
  } else {
    // Generate AI SVG for case study
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    let dataVizSvg = ''
    
    if (GEMINI_API_KEY && competencyName) {
      try {
        dataVizSvg = await callGeminiForDataViz(title, competencyName, GEMINI_API_KEY)
      } catch (error) {
        console.error('Gemini error, using fallback:', error)
        dataVizSvg = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="150" fill="oklch(0.98 0.01 240)" stroke="oklch(0.5 0.2 260)" stroke-width="2"/>
          <line x1="100" y1="200" x2="300" y2="200" stroke="oklch(0.5 0.2 260)" stroke-width="2"/>
          <line x1="200" y1="100" x2="200" y2="300" stroke="oklch(0.5 0.2 260)" stroke-width="2"/>
        </svg>`
      }
    } else {
      dataVizSvg = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="150" fill="oklch(0.98 0.01 240)" stroke="oklch(0.5 0.2 260)" stroke-width="2"/>
        <line x1="100" y1="200" x2="300" y2="200" stroke="oklch(0.5 0.2 260)" stroke-width="2"/>
        <line x1="200" y1="100" x2="200" y2="300" stroke="oklch(0.5 0.2 260)" stroke-width="2"/>
      </svg>`
    }

    component = CaseStudyThumbnail({
      title,
      domainName,
      dataVizSvg,
      duration: '90 min sim',
      difficulty: 'Advanced',
    })
  }

  // Render to SVG
  // Only include fonts if they loaded successfully (non-empty buffers)
  const fonts = []
  if (fontRegular.byteLength > 0) {
    fonts.push({ name: 'Inter', data: fontRegular, weight: 400, style: 'normal' })
  }
  if (fontMedium.byteLength > 0) {
    fonts.push({ name: 'Inter', data: fontMedium, weight: 500, style: 'normal' })
  }
  if (fontBold.byteLength > 0) {
    fonts.push({ name: 'Inter', data: fontBold, weight: 700, style: 'normal' })
  }

  const svg = await satori(component, {
    width: 1200,
    height: 630,
    fonts: fonts.length > 0 ? fonts : undefined, // Use system fonts if custom fonts unavailable
  })

  return svg
}

async function main() {
  console.log('🚀 Generating 3 thumbnails from curriculum data...\n')

  try {
    // Get lessons and cases from curriculum
    const allLessons = getAllLessonsFlat()
    const allSimulations = getAllInteractiveSimulations()

    if (allLessons.length < 2) {
      console.error('❌ Need at least 2 lessons in curriculum')
      process.exit(1)
    }

    if (allSimulations.length < 1) {
      console.error('❌ Need at least 1 case study in curriculum')
      process.exit(1)
    }

    const results: Array<{
      type: 'lesson' | 'case'
      title: string
      domainName: string
      svg: string
      dataUri: string
    }> = []

    // Generate first lesson thumbnail
    console.log(`📚 Generating Lesson 1: ${allLessons[0].lessonTitle}`)
    const lesson1 = allLessons[0]
    const domain1 = getDomainById(lesson1.domain)
    const icon1 = getIconForCompetency(lesson1.domainTitle)
    const svg1 = await generateThumbnailSVG(
      lesson1.lessonTitle,
      lesson1.domainTitle,
      icon1,
      'lesson'
    )
    
    // Convert to PNG and then to data URI
    const resvg1 = new Resvg(svg1, { font: { loadSystemFonts: false } })
    const png1 = resvg1.render().asPng()
    const dataUri1 = `data:image/png;base64,${Buffer.from(png1).toString('base64')}`
    
    results.push({
      type: 'lesson',
      title: lesson1.lessonTitle,
      domainName: lesson1.domainTitle,
      svg: svg1,
      dataUri: dataUri1,
    })

    // Generate second lesson thumbnail
    console.log(`📚 Generating Lesson 2: ${allLessons[1].lessonTitle}`)
    const lesson2 = allLessons[1]
    const icon2 = getIconForCompetency(lesson2.domainTitle)
    const svg2 = await generateThumbnailSVG(
      lesson2.lessonTitle,
      lesson2.domainTitle,
      icon2,
      'lesson'
    )
    
    const resvg2 = new Resvg(svg2, { font: { loadSystemFonts: false } })
    const png2 = resvg2.render().asPng()
    const dataUri2 = `data:image/png;base64,${Buffer.from(png2).toString('base64')}`
    
    results.push({
      type: 'lesson',
      title: lesson2.lessonTitle,
      domainName: lesson2.domainTitle,
      svg: svg2,
      dataUri: dataUri2,
    })

    // Generate case study thumbnail
    console.log(`📊 Generating Case Study: ${allSimulations[0].title}`)
    const case1 = allSimulations[0]
    const domainCase = getDomainById(case1.competencies[0]?.toLowerCase() || 'capital-allocation')
    const icon3 = 'Target'
    const svg3 = await generateThumbnailSVG(
      case1.title,
      domainCase?.title || 'Business Strategy',
      icon3,
      'case',
      case1.competencies[0] || 'Strategic Thinking'
    )
    
    const resvg3 = new Resvg(svg3, { font: { loadSystemFonts: false } })
    const png3 = resvg3.render().asPng()
    const dataUri3 = `data:image/png;base64,${Buffer.from(png3).toString('base64')}`
    
    results.push({
      type: 'case',
      title: case1.title,
      domainName: domainCase?.title || 'Business Strategy',
      svg: svg3,
      dataUri: dataUri3,
    })

    // Save SVG files
    const outputDir = path.join(process.cwd(), 'thumbnail-output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    results.forEach((result, index) => {
      const svgPath = path.join(outputDir, `thumbnail-${index + 1}-${result.type}.svg`)
      fs.writeFileSync(svgPath, result.svg)
      console.log(`✅ Saved SVG: ${svgPath}`)
    })

    // Create HTML preview
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Thumbnail Preview - 3 Generated Thumbnails</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 40px;
      background: #f5f5f5;
      margin: 0;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 30px;
      font-size: 32px;
    }
    .thumbnail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }
    .thumbnail-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .thumbnail-card h2 {
      margin: 0 0 20px 0;
      font-size: 20px;
      color: #333;
      font-weight: 600;
    }
    .thumbnail-card img {
      width: 100%;
      height: auto;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      display: block;
    }
    .info {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #666;
    }
    .info strong {
      color: #333;
      display: block;
      margin-bottom: 8px;
    }
    .info div {
      margin-bottom: 6px;
    }
    .info code {
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      color: #d63384;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
    }
    .badge-lesson {
      background: #e3f2fd;
      color: #1976d2;
    }
    .badge-case {
      background: #f3e5f5;
      color: #7b1fa2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📸 Generated Thumbnails Preview</h1>
    <div class="thumbnail-grid">
      ${results.map((result, index) => `
        <div class="thumbnail-card">
          <h2>
            <span class="badge ${result.type === 'lesson' ? 'badge-lesson' : 'badge-case'}">
              ${result.type === 'lesson' ? '📚 Lesson' : '📊 Case Study'}
            </span>
            ${index + 1}
          </h2>
          <img src="${result.dataUri}" alt="${result.title}" />
          <div class="info">
            <div><strong>Title:</strong> ${result.title}</div>
            <div><strong>Domain:</strong> ${result.domainName}</div>
            <div><strong>Type:</strong> <code>${result.type}</code></div>
            <div><strong>SVG File:</strong> <code>thumbnail-${index + 1}-${result.type}.svg</code></div>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top: 40px; padding: 20px; background: white; border-radius: 8px;">
      <h3 style="margin-top: 0;">📁 Output Files</h3>
      <p>SVG files saved to: <code>thumbnail-output/</code> directory</p>
      <ul>
        ${results.map((result, index) => 
          `<li><code>thumbnail-${index + 1}-${result.type}.svg</code></li>`
        ).join('')}
      </ul>
    </div>
  </div>
</body>
</html>`

    const htmlPath = path.join(outputDir, 'preview.html')
    fs.writeFileSync(htmlPath, htmlContent)

    console.log('\n' + '='.repeat(60))
    console.log('✅ Thumbnail Generation Complete!')
    console.log('='.repeat(60))
    console.log('\nGenerated thumbnails:')
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.type === 'lesson' ? '📚 Lesson' : '📊 Case Study'}`)
      console.log(`   Title: ${result.title}`)
      console.log(`   Domain: ${result.domainName}`)
      console.log(`   SVG: thumbnail-output/thumbnail-${index + 1}-${result.type}.svg`)
    })
    console.log(`\n📄 Preview file: ${htmlPath}`)
    console.log(`   Open this file in your browser to view all thumbnails`)
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    if (error instanceof Error) {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

main()

