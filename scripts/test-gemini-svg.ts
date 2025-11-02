/**
 * Test script to generate and save raw Gemini SVG for inspection
 */

import { callGeminiForDataViz } from '../lib/thumbnail-gemini'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set')
    process.exit(1)
  }

  const title = "Tesla's Model 3 Production Hell: Operational Excellence Under Pressure (2018)"
  const domainName = "Business Strategy"

  console.log('📡 Calling Gemini API...')
  console.log(`Title: ${title}`)
  console.log(`Domain: ${domainName}\n`)

  try {
    const svg = await callGeminiForDataViz(title, domainName, GEMINI_API_KEY)
    
    console.log(`✅ Generated SVG (${svg.length} chars)`)
    console.log('\n📋 SVG Preview:')
    console.log(svg.substring(0, 500))
    console.log('...\n')
    
    // Verify constraints
    const hasCorrectViewBox = svg.includes('viewBox="0 0 400 300"') || svg.includes("viewBox='0 0 400 300'")
    const hasWidth300 = svg.includes('width="400"') && svg.includes('height="300"')
    const hasColor1 = svg.includes('oklch(0.5 0.2 260)')
    const hasColor2 = svg.includes('oklch(0.8 0.01 240)')
    const hasStrokeRound = svg.includes('stroke-linecap="round"')
    const noText = !svg.includes('<text')
    
    console.log('✅ Constraints Check:')
    console.log(`  viewBox="0 0 400 300": ${hasCorrectViewBox ? '✓' : '✗'}`)
    console.log(`  width="400" height="300": ${hasWidth300 ? '✓' : '✗'}`)
    console.log(`  color oklch(0.5 0.2 260): ${hasColor1 ? '✓' : '✗'}`)
    console.log(`  color oklch(0.8 0.01 240): ${hasColor2 ? '✓' : '✗'}`)
    console.log(`  stroke-linecap="round": ${hasStrokeRound ? '✓' : '✗'}`)
    console.log(`  No <text> elements: ${noText ? '✓' : '✗'}`)
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'thumbnail-output', 'gemini-raw-test.svg')
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, svg)
    console.log(`\n💾 Saved raw SVG to: ${outputPath}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()

