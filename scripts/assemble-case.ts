#!/usr/bin/env tsx

/**
 * Phase 3: Assemble case study from manifest and sourced files
 * 
 * This script reads a manifest JSON and all sourced evidence files,
 * then uses AI to synthesize them into a complete case study JSON.
 * 
 * Usage:
 *   tsx scripts/assemble-case.ts --case-id cs_disney_streaming_pivot
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateWithAI, getCoreValuesPrompt } from './generate-shared'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ManifestFile {
  fileId: string
  fileName: string
  fileType: 'SEC_FILING_TABLE' | 'ANALYST_REPORT_SNAPSHOT' | 'INTERNAL_MEMO_SYNTHESIS' | 'MARKET_DATA_CHART'
  sourcingGuide: string
  synthesisInstruction: string
}

interface Manifest {
  caseId: string
  topic: string
  files: ManifestFile[]
}

const MAX_FILE_CONTENT_LENGTH = 20000 // 20k chars per file
const BASE_DIR = path.join(__dirname, '..', 'content', 'sources')

/**
 * Read and truncate file content for prompt
 */
function readFileContent(filePath: string): { content: string; truncated: boolean } {
  try {
    const fullContent = fs.readFileSync(filePath, 'utf-8')
    if (fullContent.length <= MAX_FILE_CONTENT_LENGTH) {
      return { content: fullContent, truncated: false }
    }
    
    // Truncate with a note
    const truncated = fullContent.substring(0, MAX_FILE_CONTENT_LENGTH)
    return {
      content: `${truncated}\n\n[CONTENT TRUNCATED - Original file is ${fullContent.length} characters, showing first ${MAX_FILE_CONTENT_LENGTH} characters]`,
      truncated: true
    }
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Determine file type for case study
 */
function mapFileTypeToCaseFileType(manifestType: ManifestFile['fileType']): string {
  const mapping: Record<ManifestFile['fileType'], string> = {
    'SEC_FILING_TABLE': 'FINANCIAL_DATA',
    'MARKET_DATA_CHART': 'FINANCIAL_DATA',
    'ANALYST_REPORT_SNAPSHOT': 'REPORT',
    'INTERNAL_MEMO_SYNTHESIS': 'MEMO',
  }
  return mapping[manifestType] || 'REPORT'
}

/**
 * Load manifest and all source files
 */
function loadManifestAndFiles(caseId: string): { manifest: Manifest; fileContents: Record<string, { content: string; fileName: string; fileType: string; truncated: boolean }> } {
  const manifestPath = path.join(BASE_DIR, `${caseId}-manifest.json`)
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}\nRun Phase 1 first (generate-case.ts)`)
  }
  
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  
  const caseDir = path.join(BASE_DIR, caseId)
  if (!fs.existsSync(caseDir)) {
    throw new Error(`Source files directory not found: ${caseDir}\nRun Phase 2 (manual sourcing) first`)
  }
  
  const fileContents: Record<string, { content: string; fileName: string; fileType: string; truncated: boolean }> = {}
  
  for (const file of manifest.files) {
    const filePath = path.join(caseDir, file.fileName)
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Warning: File ${file.fileName} listed in manifest but not found. Skipping.`)
      continue
    }
    
    // Determine if it's an image (no content for images)
    const isImage = /\.(png|jpg|jpeg|gif)$/i.test(file.fileName)
    
    if (isImage) {
      // For images, we just note the filename - no OCR yet
      fileContents[file.fileId] = {
        content: `[IMAGE FILE: ${file.fileName}]\nNote: This is an image file. The content cannot be directly read. Use the filename and synthesis instruction to understand how this evidence should be incorporated.`,
        fileName: file.fileName,
        fileType: mapFileTypeToCaseFileType(file.fileType),
        truncated: false
      }
    } else {
      // Read text-based files
      const result = readFileContent(filePath)
      fileContents[file.fileId] = {
        content: result.content,
        fileName: file.fileName,
        fileType: mapFileTypeToCaseFileType(file.fileType),
        truncated: result.truncated
      }
    }
  }
  
  return { manifest, fileContents }
}

/**
 * Build synthesis prompt
 */
function buildSynthesisPrompt(manifest: Manifest, fileContents: Record<string, any>, coreValues: string): string {
  const fileSections = Object.entries(fileContents).map(([fileId, data]) => {
    const manifestFile = manifest.files.find(f => f.fileId === fileId)
    return `
FILE ID: ${fileId}
FILE NAME: ${data.fileName}
FILE TYPE: ${manifestFile?.fileType || 'UNKNOWN'}
SYNTHESIS INSTRUCTION: ${manifestFile?.synthesisInstruction || 'Use this evidence in the case narrative.'}

CONTENT:
${data.content}
${data.truncated ? '\n⚠️  NOTE: Content was truncated due to length limits.' : ''}

---`
  }).join('\n')
  
  return `You are a master storyteller and instructional designer. Using the provided Case File Manifest and the raw content of each sourced file, your task is to write the complete, final ${manifest.caseId}.json file for the Execemy simulation platform.

CASE TOPIC: ${manifest.topic}
CASE ID: ${manifest.caseId}

EVIDENCE FILES:
${fileSections}

YOUR TASK:
1. Write a compelling narrative \`briefing\` that sets the stage, drawing facts and figures directly from the provided evidence files.
2. Structure the \`caseFiles\` array, referencing each file by its \`fileId\` and \`fileName\`. Use the REFERENCE source type with paths like: "content/sources/${manifest.caseId}/{fileName}"
3. Design 3-4 interactive \`stages\` (decision points) that force the user to grapple with the trade-offs revealed in the evidence.
4. For each stage, write a clear \`prompt\` and, where appropriate, define \`options\` or \`analystQuestions\` that are directly informed by the data in the files.
5. Use the \`synthesisInstruction\` from the manifest to guide how you weave each piece of evidence into the case.

OUTPUT FORMAT:
Generate a valid JSON object with this exact structure:
{
  "caseId": "${manifest.caseId}",
  "version": "1.0",
  "title": "[Descriptive Case Title]",
  "description": "[2-3 sentence overview]",
  "competencies": ["[Competency 1]", "[Competency 2]", ...],
  "estimatedDuration": 120,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "caseFiles": [
    {
      "fileId": "[fileId from manifest]",
      "fileName": "[fileName from manifest]",
      "fileType": "[FINANCIAL_DATA | MEMO | REPORT | PRESENTATION_DECK]",
      "source": {
        "type": "REFERENCE",
        "path": "content/sources/${manifest.caseId}/[fileName]"
      }
    }
  ],
  "stages": [
    {
      "stageId": "[id]",
      "stageTitle": "[Title]",
      "description": "[Description]",
      "challengeType": "[STRATEGIC_OPTIONS | FINANCIAL_MODELING | BOARD_DECK_CRITIQUE | WRITTEN_ANALYSIS | EARNINGS_CALL_QA]",
      "challengeData": {
        "prompt": "[Decision prompt]",
        "context": "[Current situation]",
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
- Include ALL files from the manifest in the caseFiles array (use REFERENCE type with proper paths)
- Design 3-4 stages with progressively complex decisions
- Include 2-4 AI personas per stage (if using STRATEGIC_OPTIONS challenge type)
- Create detailed rubric with at least 3-4 competencies
- Make scenarios realistic and grounded in the actual evidence provided
- Ensure all JSON is valid and properly formatted
- Draw specific facts and figures from the evidence files

${coreValues}

CRITICAL: Output ONLY valid JSON, no markdown formatting, no explanations. The JSON must be parseable.`
}

/**
 * Validate generated case JSON
 */
function validateCaseJSON(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
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
  if (Array.isArray(data.stages) && data.stages.length < 3) {
    errors.push('Need at least 3 stages')
  }
  
  // Validate caseFiles
  if (!data.caseFiles || !Array.isArray(data.caseFiles)) {
    errors.push('caseFiles must be an array')
  } else {
    data.caseFiles.forEach((file: any, index: number) => {
      if (!file.fileId) errors.push(`CaseFile ${index}: Missing fileId`)
      if (!file.fileName) errors.push(`CaseFile ${index}: Missing fileName`)
      if (!file.source || file.source.type !== 'REFERENCE') {
        errors.push(`CaseFile ${index}: Must use REFERENCE source type`)
      }
      if (!file.source?.path) {
        errors.push(`CaseFile ${index}: Missing source.path`)
      }
    })
  }
  
  // Validate difficulty
  if (!data.difficulty || !['beginner', 'intermediate', 'advanced'].includes(data.difficulty)) {
    errors.push('Invalid or missing difficulty')
  }
  
  // Validate estimatedDuration
  if (!data.estimatedDuration || typeof data.estimatedDuration !== 'number') {
    errors.push('Missing or invalid estimatedDuration')
  }
  
  // Validate rubric
  if (!data.rubric || !data.rubric.criteria || !Array.isArray(data.rubric.criteria)) {
    errors.push('Missing or invalid rubric')
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Main assembly function
 */
async function assembleCase(caseId: string) {
  console.log('🔧 Case Study Assembly Script (Phase 3)\n')
  console.log('========================================\n')
  
  console.log(`📋 Loading manifest for: ${caseId}`)
  const { manifest, fileContents } = loadManifestAndFiles(caseId)
  console.log(`✅ Manifest loaded: ${manifest.files.length} files`)
  console.log(`✅ Found ${Object.keys(fileContents).length} source files\n`)
  
  // List files found
  console.log('📁 Source files:')
  Object.entries(fileContents).forEach(([fileId, data]) => {
    console.log(`   - ${data.fileName} (${data.fileType})`)
    if (data.truncated) {
      console.log(`     ⚠️  Truncated for prompt (large file)`)
    }
  })
  console.log()
  
  // Get core values
  const coreValues = getCoreValuesPrompt()
  
  // Build prompt
  console.log('🤖 Building synthesis prompt...')
  const prompt = buildSynthesisPrompt(manifest, fileContents, coreValues)
  console.log(`✅ Prompt built (${prompt.length} chars)\n`)
  
  // Generate case JSON
  console.log('✨ Generating case study JSON with AI...')
  const result = await generateWithAI(prompt, 'You are a master storyteller and instructional designer specializing in executive case study design. Generate complete, realistic, challenging case study JSON structures.', { trackUsage: true })
  let caseJsonStr = result.content
  console.log(`✅ Case JSON generated (${result.model})\n`)
  
  // Clean JSON string
  caseJsonStr = caseJsonStr.trim()
  if (caseJsonStr.startsWith('```json')) {
    caseJsonStr = caseJsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (caseJsonStr.startsWith('```')) {
    caseJsonStr = caseJsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }
  
  // Parse JSON
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
  
  // Validate
  console.log('📊 Validating case structure...')
  const validation = validateCaseJSON(caseData)
  if (!validation.valid) {
    console.log(`\n⚠️  Validation errors:`)
    validation.errors.forEach(err => console.log(`   - ${err}`))
    throw new Error('Case validation failed. Please review errors above.')
  } else {
    console.log(`✅ Case structure is valid\n`)
  }
  
  // Save to data/case-studies/
  const outputPath = path.join(__dirname, '..', 'data', 'case-studies', `${caseId}.json`)
  const outputDir = path.dirname(outputPath)
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  const caseJsonFinal = JSON.stringify(caseData, null, 2)
  fs.writeFileSync(outputPath, caseJsonFinal, 'utf-8')
  
  console.log('✅ Case study assembled and saved!')
  console.log(`📁 Output: ${outputPath}`)
  console.log(`📋 Case ID: ${caseData.caseId}`)
  console.log(`\n🎯 Next steps:`)
  console.log(`   1. Review the generated case study`)
  console.log(`   2. Edit as needed`)
  console.log(`   3. Upload to storage and publish via admin panel`)
}

// CLI parsing
const args = process.argv.slice(2)
let caseId: string | null = null

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--case-id' && args[i + 1]) {
    caseId = args[i + 1]
    i++
  }
}

if (!caseId) {
  console.error('❌ Error: --case-id is required')
  console.error('Usage: tsx scripts/assemble-case.ts --case-id cs_disney_streaming_pivot')
  process.exit(1)
}

// Run
assembleCase(caseId).catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

