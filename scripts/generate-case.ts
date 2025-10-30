#!/usr/bin/env tsx

/**
 * Generate next missing case study from curriculum
 * 
 * Usage:
 *   tsx scripts/generate-case.ts
 *   tsx scripts/generate-case.ts --domain domain-id --module module-id --lesson lesson-id
 *   tsx scripts/generate-case.ts --year 1
 */

import { getAllLessonsFlat } from '../lib/curriculum-data'
import { articleExists, caseExists, generateWithAI, getCoreValuesPrompt, syncFileMetadata, uploadToStorage } from './generate-shared'

interface GenerateOptions {
  domain?: string
  module?: string
  lesson?: string
  year?: number
}

/**
 * Find next missing case study
 */
async function findNextMissingCase(
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
  
  // Check each lesson - need both article AND case to not exist
  for (const lesson of lessons) {
    const articlePath = `articles/year${year}/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}.md`
    const casePath = `cases/year${year}/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}.json`
    
    const articleExistsCheck = await articleExists(articlePath)
    const caseExistsCheck = await caseExists(casePath)
    
    // Only generate case if article exists but case doesn't
    if (articleExistsCheck && !caseExistsCheck) {
      return { lesson, storagePath: casePath }
    }
  }
  
  return null
}

/**
 * Generate case study outline
 */
async function generateCaseOutline(lesson: any, coreValues: string): Promise<string> {
  const prompt = `You are an expert business educator creating high-fidelity case study simulations for executive education.

Generate a detailed outline for an interactive case study simulation that complements the lesson "${lesson.lessonTitle}" (Module ${lesson.moduleNumber}: "${lesson.moduleTitle}" in Domain: "${lesson.domainTitle}").

LESSON DESCRIPTION: ${lesson.description}

CASE STUDY REQUIREMENTS:
- Create a realistic business scenario where executives must make critical decisions
- Design 3-4 decision stages that progressively build complexity
- Include realistic datasets (financials, metrics, customer data, etc.)
- Design personas (key stakeholders) with clear motivations and biases
- Create evaluation rubric that tests the competencies from this lesson
- Make it practical and immediately applicable

OUTLINE STRUCTURE:
1. **Scenario Setting**
   - Company context (name, industry, size, stage)
   - Current situation and challenge
   - Timeframe and urgency

2. **Role Definition**
   - Executive role the user plays
   - Authority and constraints
   - Key objectives

3. **Key Stakeholders** (2-4 personas)
   - Name, role, motivations
   - Biases and perspectives
   - What they want vs. what's best

4. **Decision Stages** (3-4 stages)
   - Stage 1: Immediate action (30 days)
   - Stage 2: Strategic decision (60-90 days)
   - Stage 3: Long-term planning (90-180 days)
   - Stage 4: Final recommendation (optional)
   - For each stage: decision prompt, options, consequences

5. **Datasets Needed**
   - Financial data (revenue, costs, metrics)
   - Customer/market data
   - Operational data
   - Competitive data

6. **Evaluation Rubric**
   - Competencies to test
   - Scoring criteria (1-5 scale)
   - Key indicators of strong vs. weak performance

${coreValues}

Please provide a detailed outline in structured format with specific details for each section.`

  const systemPrompt = 'You are an expert business educator specializing in executive case study design. Create realistic, challenging scenarios that test practical decision-making skills.'
  
  return await generateWithAI(prompt, systemPrompt)
}

/**
 * Generate full case study JSON from outline
 */
async function generateFullCase(lesson: any, outline: string, coreValues: string): Promise<string> {
  const prompt = `You are an expert business educator creating high-fidelity case study simulations.

Generate the COMPLETE case study JSON structure based on this outline:

OUTLINE:
${outline}

LESSON DETAILS:
- Title Context: "${lesson.lessonTitle}"
- Module: ${lesson.moduleNumber}. ${lesson.moduleTitle}
- Domain: ${lesson.domainTitle}

OUTPUT FORMAT:
Generate a valid JSON object with this exact structure:
{
  "caseId": "cs_[domain]_[module]_[lesson]_[short_name]",
  "version": "1.0",
  "title": "[Descriptive Case Title]",
  "description": "[2-3 sentence overview]",
  "competencies": ["[Competency 1]", "[Competency 2]", ...],
  "estimatedDuration": 120,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "caseFiles": [
    {
      "fileId": "[id]",
      "fileName": "[Name.csv or Name.md]",
      "fileType": "FINANCIAL_DATA" | "MEMO" | "REPORT" | "PRESENTATION_DECK" | "LEGAL_DOCUMENT",
      "source": {
        "type": "STATIC",
        "content": "[CSV data or Markdown content]"
      }
    }
  ],
  "stages": [
    {
      "stageId": "[id]",
      "stageTitle": "[Title]",
      "description": "[Description]",
      "challengeType": "STRATEGIC_OPTIONS" | "FINANCIAL_MODELING" | "BOARD_DECK_CRITIQUE" | "WRITTEN_ANALYSIS",
      "challengeData": {
        "prompt": "[Decision prompt]",
        "context": "[Current situation]",
        "aiPersonas": [
          {
            "name": "[Name]",
            "role": "[Role]",
            "description": "[Description]",
            "perspective": "[Their view]",
            "initialMessage": "[Opening message]"
          }
        ],
        "options": [
          {
            "id": "[id]",
            "title": "[Option title]",
            "description": "[Description]",
            "impact": {
              "[metric]": "[value]",
              ...
            }
          }
        ]
      }
    }
  ],
  "rubric": {
    "criteria": [
      {
        "competencyName": "[Name]",
        "description": "[Description]",
        "scoringGuide": {
          "1": "[Poor performance description]",
          "3": "[Average performance description]",
          "5": "[Excellent performance description]"
        }
      }
    ]
  },
  "status": "draft"
}

REQUIREMENTS:
- Include 3-4 realistic caseFiles with actual CSV data or markdown memos
- Design 3-4 stages with progressively complex decisions
- Include 2-4 AI personas per stage
- Create detailed rubric with at least 3-4 competencies
- Make scenarios realistic and grounded in real business situations
- Ensure all JSON is valid and properly formatted

${coreValues}

CRITICAL: Output ONLY valid JSON, no markdown formatting, no explanations. The JSON must be parseable.`

  const systemPrompt = 'You are an expert business educator specializing in executive case study design. Generate complete, realistic, challenging case study JSON structures.'
  
  return await generateWithAI(prompt, systemPrompt)
}

/**
 * Validate case study JSON
 */
function validateCaseJSON(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Match validation from scripts/import-content.ts
  if (!data.caseId) errors.push('Missing required field: caseId')
  if (!data.version) errors.push('Missing required field: version')
  if (!data.title) errors.push('Missing required field: title')
  if (!data.description) errors.push('Missing required field: description')
  if (!Array.isArray(data.competencies)) {
    errors.push('Missing or invalid competencies array')
  }
  if (Array.isArray(data.competencies) && data.competencies.length === 0) {
    errors.push('Competencies array cannot be empty')
  }
  if (!Array.isArray(data.stages)) {
    errors.push('Missing or invalid stages array')
  }
  
  // Validate stages (matching import-content.ts)
  if (Array.isArray(data.stages)) {
    if (data.stages.length < 3) {
      errors.push('Need at least 3 stages')
    }
    data.stages.forEach((stage: any, index: number) => {
      if (!stage.stageId) errors.push(`Stage ${index}: Missing stageId`)
      if (!stage.challengeType) errors.push(`Stage ${index}: Missing challengeType`)
      if (!stage.challengeData) errors.push(`Stage ${index}: Missing challengeData`)
    })
  }
  
  // Validate caseFiles (plan requires ≥3)
  if (data.caseFiles && !Array.isArray(data.caseFiles)) {
    errors.push('caseFiles must be an array')
  }
  if (Array.isArray(data.caseFiles) && data.caseFiles.length < 3) {
    errors.push('Need at least 3 caseFiles')
  }
  
  // Validate difficulty (plan requirement)
  if (!data.difficulty || !['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
    errors.push('Invalid or missing difficulty (must be beginner, intermediate, or advanced)')
  }
  
  // Validate estimatedDuration (plan requirement)
  if (!data.estimatedDuration || typeof data.estimatedDuration !== 'number') {
    errors.push('Missing or invalid estimatedDuration')
  }
  
  // Validate rubric (plan requirement)
  if (!data.rubric || !data.rubric.criteria || !Array.isArray(data.rubric.criteria)) {
    errors.push('Missing or invalid rubric')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Main generation function
 */
async function generateCase(options: GenerateOptions = {}) {
  const { domain: domainId, module: moduleId, lesson: lessonId, year = 1 } = options
  
  console.log('🎯 Case Study Generation Script\n')
  console.log('===============================\n')
  
  // Find next missing case
  console.log('🔍 Finding next missing case study...')
  const next = await findNextMissingCase(domainId, moduleId, lessonId, year)
  
  if (!next) {
    console.log('✅ All case studies have been generated (or missing articles)!')
    return
  }
  
  const { lesson, storagePath } = next
  console.log(`\n📝 Generating case for: ${lesson.lessonTitle}`)
  console.log(`   Domain: ${lesson.domainTitle}`)
  console.log(`   Module: ${lesson.moduleNumber}. ${lesson.moduleTitle}`)
  console.log(`   Path: ${storagePath}\n`)
  
  // Get core values
  const coreValues = getCoreValuesPrompt()
  
  // Generate outline
  console.log('📋 Generating case outline...')
  const outline = await generateCaseOutline(lesson, coreValues)
  console.log('✅ Outline generated\n')
  
  // Generate full case JSON
  console.log('✍️  Generating full case study JSON...')
  let caseJsonStr = await generateFullCase(lesson, outline, coreValues)
  console.log('✅ Case JSON generated\n')
  
  // Clean JSON string (remove markdown code blocks if present)
  caseJsonStr = caseJsonStr.trim()
  if (caseJsonStr.startsWith('```json')) {
    caseJsonStr = caseJsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (caseJsonStr.startsWith('```')) {
    caseJsonStr = caseJsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }
  
  // Parse and validate
  let caseData: any
  try {
    caseData = JSON.parse(caseJsonStr)
  } catch (error) {
    console.error('❌ Failed to parse JSON:', error)
    console.error('Raw output (first 500 chars):', caseJsonStr.substring(0, 500))
    throw new Error('Invalid JSON generated')
  }
  
  // Ensure status is draft
  caseData.status = 'draft'
  
  // Generate caseId if missing
  if (!caseData.caseId) {
    const safeDomain = lesson.domain.replace(/[^a-z0-9]/g, '_')
    const safeModule = lesson.moduleId.replace(/[^a-z0-9]/g, '_')
    const safeLesson = lesson.lessonId.replace(/[^a-z0-9]/g, '_')
    caseData.caseId = `cs_${safeDomain}_${safeModule}_${safeLesson}`
  }
  
  // Validate
  console.log('📊 Validating case structure...')
  const validation = validateCaseJSON(caseData)
  if (!validation.valid) {
    console.log(`\n⚠️  Validation errors:`)
    validation.errors.forEach(err => console.log(`   - ${err}`))
    console.log(`\n⚠️  Continuing despite errors...`)
  } else {
    console.log(`✅ Case structure is valid\n`)
  }
  
  // Convert to JSON string
  const caseJsonFinal = JSON.stringify(caseData, null, 2)
  
  // Upload to storage
  console.log('☁️  Uploading to Supabase Storage...')
  await uploadToStorage(storagePath, caseJsonFinal, 'application/json')
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
  console.log(`   Direct Edit: ${baseUrl}/admin/edit?path=${encodeURIComponent(storagePath)}&type=case`)
  console.log(`\n📋 Storage Path: ${storagePath}`)
  console.log(`📋 Case ID: ${syncResult.case_id || caseData.caseId || 'N/A'}`)
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
generateCase(options).catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

