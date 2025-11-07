#!/usr/bin/env tsx

/**
 * Generate case studies - supports multiple modes:
 * 
 * 1. Curriculum-based generation (original):
 *   tsx scripts/generate-case.ts
 *   tsx scripts/generate-case.ts --domain domain-id --module module-id --lesson lesson-id
 *   tsx scripts/generate-case.ts --year 1
 * 
 * 2. Manifest-based generation (Phase 1 - new "Cyborg" workflow):
 *   tsx scripts/generate-case.ts --topic "Disney's 2017 Streaming Pivot" --case-id cs_disney_streaming_pivot
 * 
 * 3. Blueprint-based generation (new - see generate-case-from-blueprint.ts):
 *   tsx scripts/generate-case-from-blueprint.ts --arena ARENA_1 --competency "Organizational Design" --blueprint-id two_pizza_reorg
 *   
 * Note: For blueprint-driven generation using the Crucible Framework, use generate-case-from-blueprint.ts instead.
 * This script (generate-case.ts) uses the legacy curriculum-based approach.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getAllLessonsFlat } from '../lib/curriculum-data'
import { articleExists, caseExists, generateAndUploadThumbnail, generateWithAI, getCoreValuesPrompt, isSupabaseAvailable, syncFileMetadata, uploadToStorage } from './generate-shared'
import { enhanceCaseStudyWithAI, enhanceAllCaseStudyAssets } from '../lib/ai-quality-enhancer'

interface GenerateOptions {
  domain?: string
  module?: string
  lesson?: string
  year?: number
  topic?: string
  caseId?: string
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
async function generateCaseOutline(lesson: any, coreValues: string): Promise<{ content: string; model: string }> {
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
async function generateFullCase(lesson: any, outline: string, coreValues: string): Promise<{ content: string; model: string }> {
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
  
  const result = await generateWithAI(prompt, systemPrompt, { trackUsage: true })
  return result
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
 * Phase 1: Generate manifest for AI-assisted case study
 */
async function generateManifest(topic: string, caseId: string) {
  console.log('🔍 Case Study Manifest Generation (Phase 1)\n')
  console.log('===========================================\n')
  
  console.log(`📝 Topic: ${topic}`)
  console.log(`🆔 Case ID: ${caseId}\n`)
  
  const coreValues = getCoreValuesPrompt()
  
  const prompt = `You are a senior analyst at a top-tier consulting firm preparing a case study for an executive education program. For the topic **'${topic}'**, generate a **'Case File Manifest'**. This manifest must be a JSON object listing 5-7 specific, real-world documents that are essential for understanding this business decision.

For each document, provide:
1. A unique \`fileId\` (e.g., 'financials_2017').
2. A descriptive \`fileName\` (e.g., 'Disney_Media_Networks_Financials_2017.csv').
3. A \`fileType\` ('SEC_FILING_TABLE', 'ANALYST_REPORT_SNAPSHOT', 'INTERNAL_MEMO_SYNTHESIS', 'MARKET_DATA_CHART').
4. A detailed \`sourcingGuide\` with keywords, potential URLs (like sec.gov/edgar), and instructions on what specific data to look for.
5. A \`synthesisInstruction\` explaining how this piece of evidence should be used in the final case narrative.

OUTPUT FORMAT (valid JSON only):
{
  "caseId": "${caseId}",
  "topic": "${topic}",
  "files": [
    {
      "fileId": "financials_2017",
      "fileName": "Company_Financials_2017.csv",
      "fileType": "SEC_FILING_TABLE",
      "sourcingGuide": "Go to SEC EDGAR database (sec.gov/edgar). Search for the company's 10-K filing for 2017. Locate the 'Segment Information' table in the financial statements. Extract the table and save as CSV with these specific columns: [list columns].",
      "synthesisInstruction": "Use this data to quantify the revenue streams that would be impacted by the decision. Highlight the margin differences between segments."
    }
  ]
}

REQUIREMENTS:
- Include 5-7 files total
- Mix of file types: at least 2 financial data sources, 1-2 analyst reports or market data, 1-2 internal memos or communications
- Each sourcingGuide must be actionable and specific (with URLs, exact table names, section references)
- Each synthesisInstruction should explain the strategic importance of this evidence

${coreValues}

CRITICAL: Output ONLY valid JSON, no markdown formatting, no explanations. The JSON must be parseable.`

  const systemPrompt = 'You are a senior analyst at a top-tier consulting firm. Create detailed, actionable research manifests for executive education case studies.'
  
  console.log('🤖 Generating manifest with AI...')
  const result = await generateWithAI(prompt, systemPrompt)
  let manifestStr = result.content
  console.log(`✅ Manifest generated (${result.model})\n`)
  
  // Clean JSON
  manifestStr = manifestStr.trim()
  if (manifestStr.startsWith('```json')) {
    manifestStr = manifestStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (manifestStr.startsWith('```')) {
    manifestStr = manifestStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }
  
  // Parse JSON
  let manifest: any
  try {
    manifest = JSON.parse(manifestStr)
  } catch (error) {
    console.error('❌ Failed to parse manifest JSON:', error)
    console.error('Raw output (first 500 chars):', manifestStr.substring(0, 500))
    throw new Error('Invalid manifest JSON generated')
  }
  
  // Ensure caseId matches
  manifest.caseId = caseId
  manifest.topic = topic
  
  // Validate
  if (!manifest.files || !Array.isArray(manifest.files) || manifest.files.length < 5) {
    throw new Error(`Invalid manifest: need at least 5 files, got ${manifest.files?.length || 0}`)
  }
  
  // Save manifest
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const sourcesDir = path.join(__dirname, '..', 'content', 'sources')
  
  if (!fs.existsSync(sourcesDir)) {
    fs.mkdirSync(sourcesDir, { recursive: true })
  }
  
  const manifestPath = path.join(sourcesDir, `${caseId}-manifest.json`)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
  
  console.log('✅ Manifest saved!')
  console.log(`📁 Location: ${manifestPath}\n`)
  console.log('📋 Next Steps (Phase 2 - Manual Evidence Gathering):')
  console.log(`\n1. Create source directory:`)
  console.log(`   mkdir -p content/sources/${caseId}`)
  console.log(`\n2. Source each file listed in the manifest:`)
  manifest.files.forEach((file: any, index: number) => {
    console.log(`\n   File ${index + 1}: ${file.fileName}`)
    console.log(`   Type: ${file.fileType}`)
    console.log(`   Guide: ${file.sourcingGuide.substring(0, 100)}...`)
    console.log(`   Save to: content/sources/${caseId}/${file.fileName}`)
  })
  console.log(`\n3. After sourcing all files, run Phase 3:`)
  console.log(`   tsx scripts/assemble-case.ts --case-id ${caseId}`)
}

/**
 * Main generation function
 */
async function generateCase(options: GenerateOptions = {}) {
  // Check if this is manifest generation (Phase 1)
  if (options.topic) {
    const caseId = options.caseId || `cs_${options.topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
    await generateManifest(options.topic, caseId)
    return
  }
  
  // Otherwise, proceed with curriculum-based generation
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
  const outlineResult = await generateCaseOutline(lesson, coreValues)
  const outline = outlineResult.content
  console.log(`✅ Outline generated (${outlineResult.model})\n`)
  
  // Generate full case JSON
  console.log('✍️  Generating full case study JSON...')
  const caseResult = await generateFullCase(lesson, outline, coreValues)
  let caseJsonStr = caseResult.content
  console.log(`✅ Case JSON generated (${caseResult.model})\n`)
  
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
  
  // Quality enhancement cycle
  console.log('\n✨ Enhancing case study quality...')
  try {
    caseData = await enhanceCaseStudyWithAI(caseData)
    console.log('✅ Case study structure enhanced\n')
    
    // Enhance all asset files
    caseData = await enhanceAllCaseStudyAssets(caseData)
    console.log('✅ Quality enhancement complete\n')
  } catch (error) {
    console.warn(`⚠️  Quality enhancement failed, using original: ${error}`)
    console.warn('   Continuing with original case study...\n')
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
  
  // Generate thumbnail if metadata sync succeeded
  const caseId = syncResult?.case_id
  if (caseId && isSupabaseAvailable()) {
    try {
      // Get domain name from lesson data
      const domainMapping: Record<string, string> = {
        'financial': 'Financial Acumen',
        'strategic': 'Strategic Thinking',
        'market': 'Market Awareness',
        'risk': 'Risk Management',
        'leadership': 'Leadership Judgment',
      }
      
      // Try to infer domain from competencies or lesson
      const competencies = caseData.competencies || []
      const competencyName = competencies[0] || ''
      const domainName = Object.entries(domainMapping).find(([key]) => 
        competencyName.toLowerCase().includes(key) || lesson.domainTitle.toLowerCase().includes(key)
      )?.[1] || lesson.domainTitle || 'Business Strategy'
      
      await generateAndUploadThumbnail(
        caseId,
        'case',
        caseData.title,
        domainName,
        competencyName
      )
    } catch (thumbError: any) {
      console.warn(`⚠️  Thumbnail generation failed: ${thumbError.message}`)
      console.warn(`   Thumbnail can be generated later via the admin UI\n`)
    }
  }
  
  // Output review links
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3400'
  console.log('✅ Generation complete!\n')
  console.log('📝 Review & Edit:')
  console.log(`   Content Management: ${baseUrl}/admin/content`)
  console.log(`   Direct Edit: ${baseUrl}/admin/edit?path=${encodeURIComponent(storagePath)}&type=case`)
  console.log(`\n📋 Storage Path: ${storagePath}`)
  console.log(`📋 Case ID: ${syncResult?.case_id || caseData.caseId || 'N/A'}`)
}

// CLI parsing
const args = process.argv.slice(2)
const options: GenerateOptions = {}

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--topic' && args[i + 1]) {
    options.topic = args[i + 1]
    i++
  } else if (args[i] === '--case-id' && args[i + 1]) {
    options.caseId = args[i + 1]
    i++
  } else if (args[i] === '--domain' && args[i + 1]) {
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

