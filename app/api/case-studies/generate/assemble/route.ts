// Dynamic import for script utilities (using file system path)
async function getGenerationUtils() {
  const scriptPath = path.join(process.cwd(), 'execemy', 'scripts', 'generate-shared.ts')
  const module = await import(scriptPath)
  return { 
    generateWithAI: module.generateWithAI, 
    getCoreValuesPrompt: module.getCoreValuesPrompt
  }
}

import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

const MAX_FILE_CONTENT_LENGTH = 20000 // 20k chars per file
const BASE_DIR = path.join(process.cwd(), 'execemy', 'content', 'sources')

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

function readFileContent(filePath: string): { content: string; truncated: boolean } {
  try {
    const fullContent = fs.readFileSync(filePath, 'utf-8')
    if (fullContent.length <= MAX_FILE_CONTENT_LENGTH) {
      return { content: fullContent, truncated: false }
    }
    const truncated = fullContent.substring(0, MAX_FILE_CONTENT_LENGTH)
    return {
      content: `${truncated}\n\n[CONTENT TRUNCATED - Original file is ${fullContent.length} characters, showing first ${MAX_FILE_CONTENT_LENGTH} characters]`,
      truncated: true
    }
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function mapFileTypeToCaseFileType(manifestType: ManifestFile['fileType']): string {
  const mapping: Record<ManifestFile['fileType'], string> = {
    'SEC_FILING_TABLE': 'FINANCIAL_DATA',
    'MARKET_DATA_CHART': 'FINANCIAL_DATA',
    'ANALYST_REPORT_SNAPSHOT': 'REPORT',
    'INTERNAL_MEMO_SYNTHESIS': 'MEMO',
  }
  return mapping[manifestType] || 'REPORT'
}

function loadManifestAndFiles(caseId: string): { manifest: Manifest; fileContents: Record<string, any> } {
  const manifestPath = path.join(BASE_DIR, `${caseId}-manifest.json`)
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }
  
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  
  const caseDir = path.join(BASE_DIR, caseId)
  if (!fs.existsSync(caseDir)) {
    throw new Error(`Source files directory not found: ${caseDir}`)
  }
  
  const fileContents: Record<string, any> = {}
  
  for (const file of manifest.files) {
    const filePath = path.join(caseDir, file.fileName)
    if (!fs.existsSync(filePath)) {
      continue
    }
    
    const isImage = /\.(png|jpg|jpeg|gif)$/i.test(file.fileName)
    
    if (isImage) {
      fileContents[file.fileId] = {
        content: `[IMAGE FILE: ${file.fileName}]\nNote: This is an image file. The content cannot be directly read. Use the filename and synthesis instruction to understand how this evidence should be incorporated.`,
        fileName: file.fileName,
        fileType: mapFileTypeToCaseFileType(file.fileType),
        truncated: false
      }
    } else {
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
  
  return `You are a master storyteller and instructional designer specializing in executive education. Using the provided Case File Manifest and the raw content of each sourced file, your task is to write the complete, final ${manifest.caseId}.json file for the Execemy simulation platform.

CASE TOPIC: ${manifest.topic}
CASE ID: ${manifest.caseId}

EVIDENCE FILES:
${fileSections}

YOUR TASK:
1. Write a compelling, realistic \`briefing\` (500-800 words) that sets the stage:
   - Draw facts, figures, and context directly from the provided evidence files
   - Create a sense of urgency and stakes
   - Introduce key stakeholders and their perspectives
   - Present the core challenge that requires executive decision-making
   - Make it feel like a real-world business scenario

2. Structure the \`caseFiles\` array:
   - Reference each file by its \`fileId\` and \`fileName\` from the manifest
   - Use the REFERENCE source type with paths: "content/sources/${manifest.caseId}/{fileName}"
   - Ensure all files from the manifest are included
   - Set appropriate \`fileType\` values (FINANCIAL_DATA, MEMO, REPORT, PRESENTATION_DECK, LEGAL_DOCUMENT)

3. Design 3-4 progressive \`stages\` (decision points) that:
   - Build complexity and reveal new information over time
   - Force the user to grapple with trade-offs revealed in the evidence
   - Test different executive competencies (strategic thinking, financial acumen, risk assessment, stakeholder management)
   - Include realistic time constraints and pressures
   - Each stage should feel distinct and build on previous decisions

4. For each stage:
   - Write a clear, challenging \`prompt\` (150-300 words) that presents the decision point
   - Define 3-5 realistic \`options\` that executives might consider
   - Include detailed \`impact\` data for each option (quantitative when possible from the files)
   - Add \`aiPersonas\` (2-4 stakeholders) with distinct perspectives and biases
   - Write \`initialMessage\` for each persona that reflects their position based on the evidence

5. Create a comprehensive \`rubric\`:
   - Identify 4-6 key competencies being tested
   - Provide detailed scoring guides (1-5 scale) for each competency
   - Base scoring criteria on realistic executive performance indicators
   - Ensure the rubric aligns with the evidence and decision complexity

6. Use the \`synthesisInstruction\` from the manifest to guide how you weave each piece of evidence into the case narrative, decision points, and evaluation.

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
  "stages": [...],
  "rubric": {...},
  "status": "draft"
}

${coreValues}

CRITICAL: Output ONLY valid JSON, no markdown formatting, no explanations. The JSON must be parseable.`
}

function validateCaseJSON(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.caseId) errors.push('Missing required field: caseId')
  if (!data.version) errors.push('Missing required field: version')
  if (!data.title) errors.push('Missing required field: title')
  if (!data.description) errors.push('Missing required field: description')
  if (!Array.isArray(data.competencies)) {
    errors.push('Missing or invalid competencies array')
  }
  if (!Array.isArray(data.stages) || data.stages.length < 3) {
    errors.push('Need at least 3 stages')
  }
  if (!data.caseFiles || !Array.isArray(data.caseFiles)) {
    errors.push('caseFiles must be an array')
  } else {
    data.caseFiles.forEach((file: any, index: number) => {
      if (!file.source || file.source.type !== 'REFERENCE') {
        errors.push(`CaseFile ${index}: Must use REFERENCE source type`)
      }
      if (!file.source?.path) {
        errors.push(`CaseFile ${index}: Missing source.path`)
      }
    })
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * API route for Phase 3: Assemble case study from manifest and files
 * POST /api/case-studies/generate/assemble
 */
export async function POST(request: NextRequest) {
  try {
    
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { caseId, skipThumbnail } = body

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      )
    }

    const { manifest, fileContents } = loadManifestAndFiles(caseId)
    const { generateWithAI, getCoreValuesPrompt } = await getGenerationUtils()
    const coreValues = getCoreValuesPrompt()
    const prompt = buildSynthesisPrompt(manifest, fileContents, coreValues)

    const result = await generateWithAI(
      prompt,
      'You are a master storyteller and instructional designer specializing in executive case study design. Generate complete, realistic, challenging case study JSON structures.',
      { trackUsage: true }
    )

    let caseJsonStr = result.content
    caseJsonStr = caseJsonStr.trim()
    if (caseJsonStr.startsWith('```json')) {
      caseJsonStr = caseJsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (caseJsonStr.startsWith('```')) {
      caseJsonStr = caseJsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    let caseData: any
    try {
      caseData = JSON.parse(caseJsonStr)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse case JSON', details: String(error) },
        { status: 500 }
      )
    }

    caseData.status = 'draft'
    
    // Quality enhancement cycle
    try {
      const { enhanceCaseStudyWithAI, enhanceAllCaseStudyAssets } = await import('@/lib/ai-quality-enhancer')
      caseData = await enhanceCaseStudyWithAI(caseData)
      caseData = await enhanceAllCaseStudyAssets(caseData)
    } catch (error) {
      console.warn(`Quality enhancement failed, using original: ${error}`)
      // Continue with original case study
    }
    
    const validation = validateCaseJSON(caseData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Case validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    // Save to data/case-studies/
    const outputPath = path.join(process.cwd(), 'execemy', 'data', 'case-studies', `${caseId}.json`)
    const outputDir = path.dirname(outputPath)
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(caseData, null, 2), 'utf-8')

    // Generate thumbnail for the case study (unless skipped)
    let thumbnailUrl: string | null = null
    if (!skipThumbnail && caseData.title) {
      try {
        // Get domain name from competencies or use default
        const competencyNames = Array.isArray(caseData.competencies) ? caseData.competencies : []
        const competencyName = competencyNames[0] || 'Business Strategy'
        
        // Map competency to domain
        const domainMapping: Record<string, string> = {
          'financial': 'Financial Acumen',
          'strategic': 'Strategic Thinking',
          'market': 'Market Awareness',
          'risk': 'Risk Management',
          'leadership': 'Leadership Judgment',
        }
        
        const domainName = Object.entries(domainMapping).find(([key]) => 
          competencyName.toLowerCase().includes(key)
        )?.[1] || competencyName || 'Business Strategy'

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3400'
        const thumbnailResponse = await fetch(`${baseUrl}/api/generate-thumbnail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: caseData.title,
            domainName: domainName,
            contentType: 'case',
            description: caseData.description,
            useImagen: true, // Use Imagen generation
          }),
        })

        if (thumbnailResponse.ok) {
          const thumbnailData = await thumbnailResponse.json()
          
          // Handle both PNG (Imagen) and SVG (fallback) responses
          if (thumbnailData.type === 'png') {
            // Imagen generated PNG
            thumbnailUrl = thumbnailData.imageBuffer || thumbnailData.url
            
            // Add thumbnail to case data
            caseData.thumbnailUrl = thumbnailUrl
            caseData.thumbnailType = 'png'
          } else {
            // SVG fallback (legacy)
            const svg = thumbnailData.svg
            thumbnailUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
            
            // Add thumbnail to case data
            caseData.thumbnailSvg = svg
            caseData.thumbnailUrl = thumbnailUrl
            caseData.thumbnailType = 'svg'
          }
          
          // Update saved file with thumbnail
          fs.writeFileSync(outputPath, JSON.stringify(caseData, null, 2), 'utf-8')
        }
      } catch (thumbnailError) {
        console.error('Thumbnail generation failed (non-fatal):', thumbnailError)
        // Don't fail the entire generation if thumbnail fails
      }
    }

    return NextResponse.json({
      success: true,
      caseId: caseData.caseId,
      outputPath: `data/case-studies/${caseId}.json`,
      caseData,
      thumbnailUrl
    })
  } catch (error) {
    console.error('Case assembly error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

