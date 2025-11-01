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
import {
    articleExists,
    checkRequiredSections,
    countWords,
    extractCalculations,
    extractTables,
    generateWithAI,
    getCoreValuesPrompt,
    isSupabaseAvailable,
    repairContent,
    supabase,
    syncFileMetadata,
    uploadToStorage,
} from './generate-shared'

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

const SECTION_WORD_TARGETS: Record<string, { min: number; max: number }> = {
  'executive summary': { min: 150, max: 200 },
  'core principle': { min: 400, max: 600 },
  'framework': { min: 600, max: 800 },
  'real-world examples': { min: 500, max: 700 },
  'common pitfalls': { min: 300, max: 400 },
  'application exercise': { min: 200, max: 300 },
  'key takeaways': { min: 100, max: 150 },
}

interface GenerateOptions {
  domain?: string
  module?: string
  lesson?: string
  year?: number
  dryRun?: boolean
  maxRepairs?: number
  testMode?: boolean // Generate shorter version for testing
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
- Identification of 2-3 tables to include (with column headers and example data types) - CRITICAL: These MUST be included as proper markdown tables
- Optional: 1-2 mermaid diagram concepts if helpful

CRITICAL: The outline must specify at least 2-3 tables with:
- Specific table topics (e.g., "Financial metrics comparison", "ROI calculations")
- Column headers for each table
- The type of data that will populate each table

Output the outline in a clear, structured format.`

  const systemPrompt = 'You are an expert business educator specializing in executive education. Create structured, practical outlines that emphasize real-world application and demonstrable skills.'
  
  const result = await generateWithAI(prompt, systemPrompt, { trackUsage: true })
  return result.content
}

/**
 * Generate a single section of the lesson
 */
async function generateSection(
  sectionName: string,
  sectionContext: string,
  outline: string,
  lesson: any,
  coreValues: string,
  testMode: boolean = false
): Promise<string> {
  const targetWords = testMode ? 100 : SECTION_WORD_TARGETS[sectionName.toLowerCase()]?.min || 200
  const maxWords = testMode ? 200 : SECTION_WORD_TARGETS[sectionName.toLowerCase()]?.max || 400
  
  const prompt = `You are an expert business educator creating a specific section of a lesson article.

SECTION TO GENERATE: "${sectionName}"

CONTEXT FROM OUTLINE:
${sectionContext}

FULL LESSON OUTLINE:
${outline}

LESSON DETAILS:
- Title: "${lesson.lessonTitle}"
- Module: ${lesson.moduleNumber}. ${lesson.moduleTitle}
- Domain: ${lesson.domainTitle}

REQUIREMENTS FOR THIS SECTION:
- Target length: ${targetWords}-${maxWords} words
- Professional, practical tone
- Use markdown formatting with proper headers (### for subsections), lists, emphasis
- Include specific numbers, metrics, and calculations where relevant
- Connect to the lesson's practical application focus
${sectionName === 'The Framework' || sectionName === 'Real-World Examples' ? '- MUST include at least 1 markdown table with real data (use proper table syntax with | separators)' : ''}

${coreValues}

Generate ONLY the "${sectionName}" section. Use H2 heading (## ${sectionName}) to start.`

  const systemPrompt = 'You are an expert business educator specializing in executive education. Write focused, practical sections that emphasize real-world application.'
  
  const result = await generateWithAI(prompt, systemPrompt, { trackUsage: true })
  return result.content
}

/**
 * Generate full lesson content from outline (section-by-section)
 */
async function generateFullLesson(
  lesson: any,
  outline: string,
  coreValues: string,
  testMode: boolean = false
): Promise<string> {
  const sections = [
    { name: 'Executive Summary', key: 'executive summary' },
    { name: 'Core Principle', key: 'core principle' },
    { name: 'The Framework', key: 'framework' },
    { name: 'Real-World Examples', key: 'real-world examples' },
    { name: 'Common Pitfalls', key: 'common pitfalls' },
    { name: 'Application Exercise', key: 'application exercise' },
    { name: 'Key Takeaways', key: 'key takeaways' },
  ]
  
  const sectionContents: string[] = []
  
  // Generate each section independently
  for (const section of sections) {
    console.log(`  📝 Generating section: ${section.name}...`)
    const sectionContent = await generateSection(
      section.name,
      outline, // Pass full outline for context
      outline,
      lesson,
      coreValues,
      testMode
    )
    sectionContents.push(sectionContent)
    
    // Add small delay between sections to avoid rate limits
    if (sections.indexOf(section) < sections.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Combine sections
  return sectionContents.join('\n\n')
}

/**
 * Validate generated content with comprehensive checks
 */
function validateContent(
  content: string,
  wordCount: number,
  tables: number,
  calculations: number
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Critical validations
  if (wordCount < TARGET_WORD_COUNT.min) {
    errors.push(`Word count ${wordCount} is below minimum ${TARGET_WORD_COUNT.min}`)
  } else if (wordCount > TARGET_WORD_COUNT.max * 1.2) {
    warnings.push(`Word count ${wordCount} exceeds target by >20%`)
  }
  
  if (tables < 2) {
    errors.push(`Only ${tables} table(s) found, need at least 2`)
  }
  
  if (calculations < 1) {
    warnings.push(`No calculations found - consider adding financial metrics or formulas`)
  }
  
  // Check for required sections
  const { found, missing } = checkRequiredSections(content, REQUIRED_SECTIONS)
  for (const section of missing) {
    errors.push(`Missing required section: ${section}`)
  }
  
  // Check for proper H2 headings
  const h2Count = (content.match(/^##\s+/gm) || []).length
  if (h2Count < REQUIRED_SECTIONS.length - 1) {
    warnings.push(`Only ${h2Count} H2 headings found, expected ${REQUIRED_SECTIONS.length}`)
  }
  
  // Check for key takeaways count
  const takeawaysMatch = content.match(/key takeaways/i)
  if (takeawaysMatch) {
    const takeawaysSection = content.substring(content.toLowerCase().indexOf('key takeaways'))
    const bullets = (takeawaysSection.match(/^[-*]\s+/gm) || []).length
    if (bullets < 5) {
      warnings.push(`Key takeaways section has only ${bullets} bullets, expected 5-7`)
    }
  }
  
  return { valid: errors.length === 0, errors, warnings }
}

/**
 * Main generation function
 */
async function generateLesson(options: GenerateOptions = {}) {
  const { domain: domainId, module: moduleId, lesson: lessonId, year = 1, dryRun = false, maxRepairs = 2, testMode = false } = options
  
  console.log('📚 Lesson Generation Script\n')
  console.log('==========================\n')
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be uploaded\n')
  }
  if (testMode) {
    console.log('🧪 TEST MODE - Generating shorter content\n')
  }
  
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
  
  // Resolve competency ID (skip if Supabase not available in dry-run)
  console.log('🔗 Resolving competency ID...')
  let competencyId: string | null = null
  if (supabase) {
    competencyId = await resolveCompetencyId(lesson.domain, lesson.moduleId, lesson.lessonTitle)
  } else {
    console.log('   ⚠️  Supabase not available - skipping competency resolution')
  }
  console.log(`   Competency ID: ${competencyId || 'Not found (will use placeholder)'}\n`)
  
  // Get core values
  const coreValues = getCoreValuesPrompt()
  
  // Generate outline
  console.log('📋 Generating outline...')
  const outline = await generateOutline(lesson, coreValues)
  console.log('✅ Outline generated\n')
  
  // Generate full content section-by-section
  console.log('✍️  Generating full lesson content (section-by-section)...')
  let content = await generateFullLesson(lesson, outline, coreValues, testMode)
  console.log('✅ Content generated\n')
  
  // Validate with comprehensive checks
  let wordCount = countWords(content)
  let tables = extractTables(content)
  let calculations = extractCalculations(content)
  console.log(`📊 Validation:`)
  console.log(`   Word count: ${wordCount}`)
  console.log(`   Tables: ${tables}`)
  console.log(`   Calculations: ${calculations}`)
  
  let validation = validateContent(content, wordCount, tables, calculations)
  let repairAttempts = 0
  
  // Auto-repair loop (only if there are critical errors, not warnings)
  while (!validation.valid && repairAttempts < maxRepairs && validation.errors.length > 0) {
    console.log(`\n🔧 Auto-repair attempt ${repairAttempts + 1}/${maxRepairs}...`)
    const systemPrompt = 'You are an expert business educator specializing in executive education. Fix validation errors while EXPANDING and IMPROVING content quality.'
    
    try {
      const originalWordCount = wordCount
      const originalTables = tables
      
      const repaired = await repairContent(content, validation.errors, '', systemPrompt)
      const newWordCount = countWords(repaired)
      const newTables = extractTables(repaired)
      const newCalculations = extractCalculations(repaired)
      
      // Check if repair actually improved things
      const improved = newWordCount >= originalWordCount && newTables >= originalTables
      
      validation = validateContent(repaired, newWordCount, newTables, newCalculations)
      
      if (improved || validation.valid) {
        if (validation.valid) {
          console.log(`   ✅ Repair successful!`)
        } else {
          console.log(`   ⚠️  Repair improved content but errors remain`)
        }
        content = repaired
        wordCount = newWordCount
        tables = newTables
        calculations = newCalculations
        
        if (validation.valid) {
          break
        }
      } else {
        console.log(`   ⚠️  Repair made content worse, keeping original`)
        // Don't update content if repair made it worse
      }
      
      repairAttempts++
      if (!validation.valid && repairAttempts < maxRepairs) {
        console.log(`   Continuing with repair attempt ${repairAttempts + 1}...`)
      }
    } catch (error) {
      console.log(`   ⚠️  Repair failed: ${error}`)
      break
    }
  }
  
  // Report validation results
  if (validation.warnings.length > 0) {
    console.log(`\n⚠️  Validation warnings:`)
    validation.warnings.forEach(w => console.log(`   - ${w}`))
  }
  
  if (!validation.valid) {
    console.log(`\n❌ Validation errors (after ${repairAttempts} repair attempts):`)
    validation.errors.forEach(err => console.log(`   - ${err}`))
    if (!dryRun) {
      console.log(`\n⚠️  Continuing despite errors...`)
    }
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
    duration: testMode ? 6 : 12,
    difficulty: 'intermediate',
    status: 'draft',
  }
  
  // Assemble markdown (content may have been repaired)
  const markdown = matter.stringify(content, frontmatter)
  
  if (dryRun) {
    console.log('\n📄 DRY RUN - Content preview (first 2000 chars):')
    console.log(markdown.substring(0, 2000) + '...\n')
    console.log(`\n📊 Final Stats:`)
    console.log(`   Word count: ${wordCount}`)
    console.log(`   Tables: ${tables}`)
    console.log(`   Calculations: ${calculations}`)
    console.log(`   Sections found: ${validation.warnings.length === 0 ? 'All' : 'Some missing'}`)
    console.log('\n✅ Dry run complete - no files uploaded')
    return
  }
  
  // Check Supabase availability before uploading
  if (!isSupabaseAvailable()) {
    throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
  }
  
  // Upload to storage
  console.log('☁️  Uploading to Supabase Storage...')
  await uploadToStorage(storagePath, markdown, 'text/markdown')
  console.log('✅ Uploaded\n')
  
  // Sync metadata (non-blocking - file is already in storage)
  console.log('🔄 Syncing metadata to database...')
  let syncResult: any = null
  try {
    syncResult = await syncFileMetadata(storagePath)
    console.log(`✅ ${syncResult?.message || syncResult?.success || 'Metadata synced'}\n`)
  } catch (syncError: any) {
    console.warn(`⚠️  Metadata sync failed (file is in storage): ${syncError.message}`)
    console.warn(`   You can manually sync via /api/storage/sync or the admin UI\n`)
    // Don't throw - file is uploaded successfully
  }
  
  // Output review links
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3400'
  console.log('✅ Generation complete!\n')
  console.log('📝 Review & Edit:')
  console.log(`   Content Management: ${baseUrl}/admin/content`)
  console.log(`   Direct Edit: ${baseUrl}/admin/edit?path=${encodeURIComponent(storagePath)}&type=article`)
  console.log(`\n📋 Storage Path: ${storagePath}`)
  console.log(`📋 Article ID: ${syncResult?.article_id || 'N/A'}`)
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
  } else if (args[i] === '--dry-run') {
    options.dryRun = true
  } else if (args[i] === '--test') {
    options.testMode = true
  } else if (args[i] === '--max-repairs' && args[i + 1]) {
    options.maxRepairs = parseInt(args[i + 1], 10)
    i++
  }
}

// Run
generateLesson(options).catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

