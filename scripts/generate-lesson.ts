#!/usr/bin/env tsx

/**
 * Generate next missing lesson article from curriculum
 * 
 * Usage:
 *   tsx scripts/generate-lesson.ts
 *   tsx scripts/generate-lesson.ts --domain domain-id --module module-id --lesson lesson-id
 *   tsx scripts/generate-lesson.ts --year 1
 */

import matter from 'gray-matter'
import { completeCurriculumData, getAllLessonsFlat } from '../lib/curriculum-data'
import { articleExists, countWords, extractTables, generateWithAI, getCoreValuesPrompt, supabase, syncFileMetadata, uploadToStorage } from './generate-shared'

const TARGET_WORD_COUNT = { min: 1800, max: 2400 }
const REQUIRED_SECTIONS = [
  'executive summary',
  'core principle',
  'framework',
  'real-world examples',
  'common pitfalls',
  'application exercise',
  'key takeaways',
]

interface GenerateOptions {
  domain?: string
  module?: string
  lesson?: string
  year?: number
}

/**
 * Find next missing lesson
 */
async function findNextMissingLesson(
  domainId: string | undefined,
  moduleId: string | undefined,
  lessonId: string | undefined,
  year: number
) {
  const allLessons = getAllLessonsFlat()
  
  // Filter by domain/module/lesson if specified
  let lessons = allLessons
  if (domainId) {
    lessons = lessons.filter(l => l.domain === domainId)
    if (moduleId) {
      lessons = lessons.filter(l => l.moduleId === moduleId)
      if (lessonId) {
        lessons = lessons.filter(l => l.lessonId === lessonId)
      }
    }
  }
  
  // Check each lesson
  for (const lesson of lessons) {
    const storagePath = `articles/year${year}/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}.md`
    const exists = await articleExists(storagePath)
    
    if (!exists) {
      return { lesson, storagePath }
    }
  }
  
  return null
}

/**
 * Resolve competency_id from lesson
 */
async function resolveCompetencyId(domainId: string, moduleId: string, lessonTitle: string): Promise<string | null> {
  // Get domain by matching curriculum structure
  const domain = completeCurriculumData.find(d => d.id === domainId)
  if (!domain) {
    console.warn('  ⚠️  Domain not found in curriculum')
    return null
  }
  
  // Get domain competency
  const { data: domainComp } = await supabase
    .from('competencies')
    .select('id')
    .eq('level', 'domain')
    .ilike('name', `%${domain.title}%`)
    .maybeSingle()
  
  if (!domainComp) {
    console.warn('  ⚠️  Domain competency not found')
    return null
  }
  
  // Get module competency (parent of micro-skills)
  const module = domain.modules.find(m => m.id === moduleId)
  if (!module) {
    return domainComp.id
  }
  
  const { data: moduleComp } = await supabase
    .from('competencies')
    .select('id')
    .eq('level', 'competency')
    .eq('parent_id', domainComp.id)
    .ilike('name', `%${module.title}%`)
    .maybeSingle()
  
  if (!moduleComp) {
    return domainComp.id
  }
  
  // Get micro-skill (lesson) competency
  const { data: microSkill } = await supabase
    .from('competencies')
    .select('id')
    .eq('level', 'micro_skill')
    .eq('parent_id', moduleComp.id)
    .ilike('name', `%${lessonTitle}%`)
    .maybeSingle()
  
  if (microSkill) {
    return microSkill.id
  }
  
  // Fallback to module competency
  return moduleComp.id
}

/**
 * Generate lesson outline
 */
async function generateOutline(lesson: any, coreValues: string): Promise<string> {
  const prompt = `You are an expert business educator creating comprehensive curriculum content for executive education.

Generate a detailed outline for a lesson on "${lesson.lessonTitle}" within Module ${lesson.moduleNumber}: "${lesson.moduleTitle}" in Domain: "${lesson.domainTitle}".

LESSON DESCRIPTION: ${lesson.description}

REQUIREMENTS:
- Target length: ${TARGET_WORD_COUNT.min}-${TARGET_WORD_COUNT.max} words (approximately 2-3 A4 pages)
- Professional, practical tone focused on actionable frameworks

OUTLINE STRUCTURE:
1. **Executive Summary** (150-200 words)
   - Key concept overview
   - Why this matters for executives
   - Main takeaways

2. **Core Principle** (400-600 words)
   - Fundamental concept explanation
   - Theoretical foundation
   - Industry context

3. **The Framework** (600-800 words)
   - Step-by-step methodology
   - Decision criteria
   - Implementation process
   - Include specific tables and calculations (identify 2-3 tables to include)

4. **Real-World Examples** (500-700 words)
   - List 2-3 specific companies to analyze
   - Specific numbers and outcomes to include
   - Lessons learned from each

5. **Common Pitfalls** (300-400 words)
   - Typical mistakes
   - Warning signs
   - How to avoid them

6. **Application Exercise** (200-300 words)
   - Practical scenario
   - Questions for reflection
   - Next steps

7. **Key Takeaways** (100-150 words)
   - 5-7 bullet points
   - Actionable insights

${coreValues}

Please provide a detailed hierarchical outline with:
- Section headings and subheadings
- Brief notes on what content goes in each section
- List of 2-3 companies/examples to use with specific data points
- Identification of 2-3 tables to include (with column headers and example data types)
- Optional: 1-2 mermaid diagram concepts if helpful

Output the outline in a clear, structured format.`

  const systemPrompt = 'You are an expert business educator specializing in executive education. Create structured, practical outlines that emphasize real-world application and demonstrable skills.'
  
  return await generateWithAI(prompt, systemPrompt)
}

/**
 * Generate full lesson content from outline
 */
async function generateFullLesson(lesson: any, outline: string, coreValues: string): Promise<string> {
  const prompt = `You are an expert business educator creating comprehensive curriculum content for executive education.

Generate the COMPLETE, FULL lesson article based on this outline:

OUTLINE:
${outline}

LESSON DETAILS:
- Title: "${lesson.lessonTitle}"
- Module: ${lesson.moduleNumber}. ${lesson.moduleTitle}
- Domain: ${lesson.domainTitle}
- Description: ${lesson.description}

REQUIREMENTS:
- Exact length: ${TARGET_WORD_COUNT.min}-${TARGET_WORD_COUNT.max} words (strictly enforce)
- Professional, practical tone
- Include ALL sections from the outline
- Include 2-3 tables with real data (use markdown table syntax)
- Optionally include 1-2 Mermaid diagrams wrapped in \`\`\`mermaid blocks
- Use markdown formatting with proper headers (##, ###), lists, emphasis
- Include specific numbers, metrics, and calculations where relevant
- Make content immediately applicable for senior executives

${coreValues}

CRITICAL: Ensure the content is comprehensive, long-form (${TARGET_WORD_COUNT.min}+ words), and includes at least 2 tables with concrete data.`

  const systemPrompt = 'You are an expert business educator and content creator specializing in executive education and strategic business thinking. Write comprehensive, practical, immediately applicable content.'
  
  return await generateWithAI(prompt, systemPrompt)
}

/**
 * Validate generated content
 */
function validateContent(content: string, wordCount: number, tables: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (wordCount < TARGET_WORD_COUNT.min) {
    errors.push(`Word count ${wordCount} is below minimum ${TARGET_WORD_COUNT.min}`)
  }
  
  if (tables < 2) {
    errors.push(`Only ${tables} table(s) found, need at least 2`)
  }
  
  // Check for required sections
  const contentLower = content.toLowerCase()
  for (const section of REQUIRED_SECTIONS) {
    if (!contentLower.includes(section)) {
      errors.push(`Missing required section: ${section}`)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Main generation function
 */
async function generateLesson(options: GenerateOptions = {}) {
  const { domain: domainId, module: moduleId, lesson: lessonId, year = 1 } = options
  
  console.log('📚 Lesson Generation Script\n')
  console.log('==========================\n')
  
  // Find next missing lesson
  console.log('🔍 Finding next missing lesson...')
  const next = await findNextMissingLesson(domainId, moduleId, lessonId, year)
  
  if (!next) {
    console.log('✅ All lessons have been generated!')
    return
  }
  
  const { lesson, storagePath } = next
  console.log(`\n📝 Generating: ${lesson.lessonTitle}`)
  console.log(`   Domain: ${lesson.domainTitle}`)
  console.log(`   Module: ${lesson.moduleNumber}. ${lesson.moduleTitle}`)
  console.log(`   Path: ${storagePath}\n`)
  
  // Resolve competency ID
  console.log('🔗 Resolving competency ID...')
  const competencyId = await resolveCompetencyId(lesson.domain, lesson.moduleId, lesson.lessonTitle)
  console.log(`   Competency ID: ${competencyId || 'Not found (will use placeholder)'}\n`)
  
  // Get core values
  const coreValues = getCoreValuesPrompt()
  
  // Generate outline
  console.log('📋 Generating outline...')
  const outline = await generateOutline(lesson, coreValues)
  console.log('✅ Outline generated\n')
  
  // Generate full content
  console.log('✍️  Generating full lesson content...')
  const content = await generateFullLesson(lesson, outline, coreValues)
  console.log('✅ Content generated\n')
  
  // Validate
  const wordCount = countWords(content)
  const tables = extractTables(content)
  console.log(`📊 Validation:`)
  console.log(`   Word count: ${wordCount}`)
  console.log(`   Tables: ${tables}`)
  
  const validation = validateContent(content, wordCount, tables)
  if (!validation.valid) {
    console.log(`\n⚠️  Validation warnings:`)
    validation.errors.forEach(err => console.log(`   - ${err}`))
    console.log(`\n⚠️  Continuing despite warnings...`)
  } else {
    console.log(`✅ Content meets quality standards\n`)
  }
  
  // Create frontmatter
  const frontmatter = {
    title: `${lesson.moduleNumber}.${lesson.lessonNumber}: ${lesson.lessonTitle}`,
    description: lesson.description || '',
    competency_id: competencyId || null,
    domain: lesson.domain,
    module: lesson.moduleId,
    lesson_number: lesson.lessonNumber,
    duration: 12,
    difficulty: 'intermediate',
    status: 'draft',
  }
  
  // Assemble markdown
  const markdown = matter.stringify(content, frontmatter)
  
  // Upload to storage
  console.log('☁️  Uploading to Supabase Storage...')
  await uploadToStorage(storagePath, markdown, 'text/markdown')
  console.log('✅ Uploaded\n')
  
  // Sync metadata
  console.log('🔄 Syncing metadata to database...')
  const syncResult = await syncFileMetadata(storagePath)
  console.log(`✅ ${syncResult.message || 'Metadata synced'}\n`)
  
  // Output review links
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400'
  console.log('✅ Generation complete!\n')
  console.log('📝 Review & Edit:')
  console.log(`   Content Management: ${baseUrl}/admin/content`)
  console.log(`   Direct Edit: ${baseUrl}/admin/edit?path=${encodeURIComponent(storagePath)}&type=article`)
  console.log(`\n📋 Storage Path: ${storagePath}`)
  console.log(`📋 Article ID: ${syncResult.article_id || 'N/A'}`)
}

// CLI parsing
const args = process.argv.slice(2)
const options: GenerateOptions = {}

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--domain' && args[i + 1]) {
    options.domain = args[i + 1]
    i++
  } else if (args[i] === '--module' && args[i + 1]) {
    options.module = args[i + 1]
    i++
  } else if (args[i] === '--lesson' && args[i + 1]) {
    options.lesson = args[i + 1]
    i++
  } else if (args[i] === '--year' && args[i + 1]) {
    options.year = parseInt(args[i + 1], 10)
    i++
  }
}

// Run
generateLesson(options).catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

