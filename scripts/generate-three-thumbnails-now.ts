/**
 * Generate 3 thumbnails immediately and save as SVG files
 */

import { getAllLessonsFlat, getDomainById } from '../lib/curriculum-data'
import { getAllInteractiveSimulations } from '../lib/case-study-loader'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('🚀 Generating 3 thumbnails NOW...\n')

  try {
    // Get content from curriculum
    const allLessons = getAllLessonsFlat()
    const allSimulations = getAllInteractiveSimulations()

    if (allLessons.length < 2) {
      console.error('❌ Need at least 2 lessons')
      process.exit(1)
    }

    if (allSimulations.length < 1) {
      console.error('❌ Need at least 1 case study')
      process.exit(1)
    }

    const results: Array<{
      type: 'lesson' | 'case'
      title: string
      domainName: string
      svgPath: string
    }> = []

    // Create output directory
    const outputDir = path.join(process.cwd(), 'thumbnail-output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Generate Lesson 1
    console.log(`📚 Generating Lesson 1: ${allLessons[0].lessonTitle}`)
    const lesson1 = allLessons[0]
    const icon1 = lesson1.domainTitle.toLowerCase().includes('capital') ? 'DollarSign' : 'BookOpen'
    
    const response1 = await fetch('http://localhost:3400/api/generate-thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: lesson1.lessonTitle,
        domainName: lesson1.domainTitle,
        contentType: 'lesson',
      }),
    })

    if (!response1.ok) {
      throw new Error(`Failed to generate thumbnail 1: ${response1.statusText}`)
    }

    const { svg: svg1 } = await response1.json()
    const svgPath1 = path.join(outputDir, 'thumbnail-1-lesson.svg')
    fs.writeFileSync(svgPath1, svg1)
    results.push({
      type: 'lesson',
      title: lesson1.lessonTitle,
      domainName: lesson1.domainTitle,
      svgPath: svgPath1,
    })
    console.log(`✅ Saved: ${svgPath1}`)

    // Generate Lesson 2
    console.log(`\n📚 Generating Lesson 2: ${allLessons[1].lessonTitle}`)
    const lesson2 = allLessons[1]
    const icon2 = lesson2.domainTitle.toLowerCase().includes('capital') ? 'DollarSign' : 'BookOpen'
    
    const response2 = await fetch('http://localhost:3400/api/generate-thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: lesson2.lessonTitle,
        domainName: lesson2.domainTitle,
        contentType: 'lesson',
      }),
    })

    if (!response2.ok) {
      throw new Error(`Failed to generate thumbnail 2: ${response2.statusText}`)
    }

    const { svg: svg2 } = await response2.json()
    const svgPath2 = path.join(outputDir, 'thumbnail-2-lesson.svg')
    fs.writeFileSync(svgPath2, svg2)
    results.push({
      type: 'lesson',
      title: lesson2.lessonTitle,
      domainName: lesson2.domainTitle,
      svgPath: svgPath2,
    })
    console.log(`✅ Saved: ${svgPath2}`)

    // Generate Case Study
    console.log(`\n📊 Generating Case Study: ${allSimulations[0].title}`)
    const case1 = allSimulations[0]
    const domainCase = getDomainById(case1.competencies[0]?.toLowerCase() || 'capital-allocation')
    
    const response3 = await fetch('http://localhost:3400/api/generate-thumbnail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: case1.title,
        domainName: domainCase?.title || 'Business Strategy',
        contentType: 'case',
        competencyName: case1.competencies[0] || 'Strategic Thinking',
      }),
    })

    if (!response3.ok) {
      throw new Error(`Failed to generate thumbnail 3: ${response3.statusText}`)
    }

    const { svg: svg3 } = await response3.json()
    const svgPath3 = path.join(outputDir, 'thumbnail-3-case.svg')
    fs.writeFileSync(svgPath3, svg3)
    results.push({
      type: 'case',
      title: case1.title,
      domainName: domainCase?.title || 'Business Strategy',
      svgPath: svgPath3,
    })
    console.log(`✅ Saved: ${svgPath3}`)

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL 3 THUMBNAILS GENERATED!')
    console.log('='.repeat(60))
    console.log('\nGenerated files:')
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.type === 'lesson' ? '📚 Lesson' : '📊 Case Study'}`)
      console.log(`   Title: ${result.title}`)
      console.log(`   File: ${result.svgPath}`)
    })
    console.log(`\n📁 All files in: ${outputDir}`)
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

