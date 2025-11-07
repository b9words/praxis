import { getCurrentUser } from '@/lib/auth/get-user'
import {
    buildCaseGenerationPrompt,
    buildCaseOutlinePrompt,
    buildAssetGenerationPrompt,
} from '@/lib/case-generation-prompts'
import { createCaseWithFiles, type CaseFileInput, upsertCaseFile, getCaseFile } from '@/lib/db/cases'
import {
    generateAndUploadThumbnail,
    generateWithAI,
    isSupabaseAvailable,
} from '@/scripts/generate-shared'
import { getMimeTypeForAsset, getExtensionForAsset } from '@/lib/asset-utils'
import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export const runtime = 'nodejs'

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean
  errors: string[]
  content?: string
}

/**
 * Extract JSON from text that might contain explanatory content
 */
function extractJSON(text: string): string {
  let extracted = text.trim()
  
  // Remove markdown code blocks if present
  if (extracted.startsWith('```json')) {
    extracted = extracted.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (extracted.startsWith('```')) {
    extracted = extracted.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }
  
  // Try to find the actual JSON start (might have preamble)
  const jsonStart = extracted.indexOf('{')
  if (jsonStart > 0) {
    extracted = extracted.substring(jsonStart)
  }
  
  // Try to find the actual JSON end by matching braces
  let braceCount = 0
  let lastValidBrace = -1
  let inString = false
  let escapeNext = false
  
  for (let i = 0; i < extracted.length; i++) {
    const char = extracted[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString
      continue
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++
      } else if (char === '}') {
        braceCount--
        if (braceCount === 0) {
          lastValidBrace = i
          break // Found the end of the root object
        }
      }
    }
  }
  
  if (lastValidBrace > 0 && lastValidBrace < extracted.length - 1) {
    extracted = extracted.substring(0, lastValidBrace + 1)
  } else if (lastValidBrace === -1 && braceCount > 0) {
    // JSON might be incomplete - try to find where it should end
    // This is a fallback for truncated JSON
    console.warn('[generate-case] JSON appears incomplete, attempting to extract valid portion')
  }
  
  return extracted.trim()
}

/**
 * Attempt to repair malformed JSON
 */
function repairJSON(jsonStr: string): string {
  // First, try to extract JSON from potentially mixed content
  let repaired = extractJSON(jsonStr)
  
  // Fix common JSON issues
  // 1. Remove trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1')
  
  // 2. Remove comments (JSON doesn't support comments)
  repaired = repaired.replace(/\/\/.*$/gm, '')
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // 3. Fix single quotes to double quotes (basic)
  // Only replace single quotes that are clearly meant to be string delimiters
  repaired = repaired.replace(/'(\w+)':/g, '"$1":')
  
  // 4. Attempt to fix unescaped quotes in string values
  // This is a more sophisticated approach that tries to identify string boundaries
  // and escape quotes that are clearly inside string values
  try {
    // First, try a simple approach: find string patterns and escape internal quotes
    // Pattern: "key": "value" -> look for quotes that aren't properly escaped
    let inString = false
    let escapeNext = false
    let result = ''
    
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i]
      const prevChar = i > 0 ? repaired[i - 1] : ''
      
      if (escapeNext) {
        result += char
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        result += char
        escapeNext = true
        continue
      }
      
      if (char === '"') {
        // Check if this is a string delimiter or an internal quote
        if (inString) {
          // We're inside a string - check if this looks like the end of the string
          // Look ahead to see if we have : or , or } or ] next (after whitespace)
          const nextNonWhitespace = repaired.substring(i + 1).match(/^\s*([:,\}\]])/)?.[1]
          if (nextNonWhitespace) {
            // This looks like the end of a string
            inString = false
            result += char
          } else {
            // This might be an unescaped quote inside a string - escape it
            result += '\\"'
          }
        } else {
          // Starting a new string
          inString = true
          result += char
        }
      } else {
        result += char
      }
    }
    
    repaired = result
  } catch (quoteFixError) {
    // If quote fixing fails, continue with the original repaired string
    console.warn('[generate-case] Quote fixing failed, using original:', quoteFixError)
  }
  
  return repaired
}

/**
 * Parse JSON with multiple repair attempts
 */
function parseJSONWithRepair(jsonStr: string, maxAttempts: number = 3): { success: boolean; data?: any; error?: string; repairedStr?: string } {
  let currentStr = jsonStr
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const parsed = JSON.parse(currentStr)
      return { success: true, data: parsed, repairedStr: attempt > 0 ? currentStr : undefined }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxAttempts - 1) {
        // Try to repair
        currentStr = repairJSON(currentStr)
        
        // Log repair attempt
        if (attempt === 0) {
          console.warn(`[generate-case] JSON parse failed, attempting repair (attempt ${attempt + 1}/${maxAttempts})`)
          console.warn(`[generate-case] Parse error: ${lastError.message}`)
        }
      }
    }
  }
  
  return { 
    success: false, 
    error: lastError?.message || 'Failed to parse JSON after repair attempts',
    repairedStr: currentStr 
  }
}

/**
 * Validate asset content based on file type
 */
function validateAssetContent(
  content: string,
  fileType: string,
  fileName: string
): ValidationResult {
  const errors: string[] = []
  let cleanedContent = content.trim()

  // Remove code fences if present
  if (cleanedContent.startsWith('```')) {
    const lines = cleanedContent.split('\n')
    if (lines[0].startsWith('```')) {
      lines.shift()
    }
    if (lines[lines.length - 1].trim() === '```') {
      lines.pop()
    }
    cleanedContent = lines.join('\n').trim()
  }

  // Check for placeholders
  if (/\bPlaceholder\b|\[Placeholder/i.test(cleanedContent)) {
    errors.push('Content contains placeholder text')
  }

  // Type-specific validation (HBR-quality thresholds)
  switch (fileType) {
    case 'PRESENTATION_DECK': {
      const hasFrontmatter = /^---\s*\n[\s\S]*?\n---\s*\n/.test(cleanedContent)
      const hasSeparators = cleanedContent.includes('\n---\n')
      if (!hasFrontmatter) {
        errors.push('Missing Marp frontmatter')
      }
      if (hasSeparators) {
        const slideSeparators = (cleanedContent.match(/\n---\n/g) || []).length
        if (slideSeparators < 11) {
          errors.push(`Too few slides: found ${slideSeparators + 1}, need at least 12 for HBR quality`)
        }
      } else {
        errors.push('Missing slide separators (---)')
      }
      break
    }
    case 'FINANCIAL_DATA': {
      const lines = cleanedContent.split('\n').filter(l => l.trim())
      if (lines.length < 17) {
        errors.push(`Insufficient rows: expected at least 17 (1 header + 16 data), got ${lines.length}`)
      }
      break
    }
    case 'STAKEHOLDER_PROFILES': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (!Array.isArray(parsed)) {
          errors.push('Must be a JSON array')
        } else if (parsed.length < 5 || parsed.length > 7) {
          errors.push(`Array length must be 5-7 for HBR quality, got ${parsed.length}`)
        }
      } catch {
        errors.push('Invalid JSON format')
      }
      break
    }
    case 'MARKET_DATASET': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (!Array.isArray(parsed)) {
          errors.push('Must be a JSON array')
        } else if (parsed.length < 24) {
          errors.push(`Array must have at least 24 items for HBR quality, got ${parsed.length}`)
        }
      } catch {
        errors.push('Invalid JSON format')
      }
      break
    }
    case 'ORG_CHART': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (parsed.organization && Array.isArray(parsed.organization)) {
          const countEmployees = (org: any[]): number => {
            let count = 0
            for (const item of org) {
              count++
              if (item.children && Array.isArray(item.children)) {
                count += countEmployees(item.children)
              }
            }
            return count
          }
          const total = countEmployees(parsed.organization)
          if (total < 12) {
            errors.push(`Organization must have at least 12 employees for HBR quality, got ${total}`)
          }
        }
      } catch {
        errors.push('Invalid JSON format')
      }
      break
    }
    case 'REPORT':
    case 'INTERNAL_MEMO':
    case 'PRESS_RELEASE':
    case 'LEGAL_DOCUMENT':
    case 'MEMO': {
      const wordCount = cleanedContent.split(/\s+/).filter(w => w.length > 0).length
      if (wordCount < 900) {
        errors.push(`Content too short: ${wordCount} words, need at least 900 for HBR quality`)
      }
      const headingMatches = cleanedContent.match(/^#{1,2}\s+.+$/gm) || []
      if (headingMatches.length < 5) {
        errors.push(`Missing headings: found ${headingMatches.length}, need at least 5 for HBR quality`)
      }
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    content: cleanedContent,
  }
}

/**
 * Build repair prompt for failed validation
 */
function buildRepairPrompt(
  originalPrompt: string,
  validationErrors: string[],
  assetName: string,
  fileType: string
): string {
  const needsExpansion = validationErrors.some(e => 
    e.includes('too short') || e.includes('too few') || e.includes('need at least')
  )
  
  return `${originalPrompt}

VALIDATION FAILED:
The generated content did not meet HBR-quality requirements. Errors:
${validationErrors.map(e => `- ${e}`).join('\n')}

REPAIR INSTRUCTIONS:
${needsExpansion ? 'CRITICAL: EXPAND the content to meet length/data thresholds. Add more detail, more data points, more sections, more depth.' : ''}
- Fix all validation errors listed above
- Ensure the output format exactly matches the requirements
- Do not include any explanations or code fences
- Output ONLY the corrected raw content
- If content is too short, EXPAND it significantly with more detail and substance
- If data is insufficient, ADD more rows/entries to meet minimum requirements

Regenerate the ${fileType} asset "${assetName}" with all errors fixed and expanded to HBR-quality standards.`
}

/**
 * Generate a single asset synchronously with validation and repair
 */
async function generateSingleAssetSync(
  caseId: string,
  file: { fileId: string; fileName: string; fileType: string },
  caseData: any,
  blueprint: any,
  competency: any,
  framework: any
): Promise<{
  success: boolean
  fileId: string
  error?: string
  validationErrors?: string[]
  contentLength?: number
}> {
  try {
    console.info(`[generate-case] Generating ${file.fileName} (${file.fileType})`)

    // Build prompt
    const assetPrompt = buildAssetGenerationPrompt(
      file.fileName.replace(/\.[^.]+$/, ''), // Remove extension for prompt
      file.fileType as any,
      blueprint,
      competency,
      framework
    )

    // Generate with AI
    const result = await generateWithAI(
      assetPrompt,
      'You are an expert business analyst creating realistic case study materials.',
      { trackUsage: true }
    )

    // Validate
    let validation = validateAssetContent(result.content, file.fileType, file.fileName)
    let finalContent = validation.content || result.content

    // Attempt repair if validation failed
    if (!validation.valid) {
      console.warn(`[generate-case] Validation failed for ${file.fileId}, attempting repair`)
      try {
        const repairPrompt = buildRepairPrompt(assetPrompt, validation.errors, file.fileName, file.fileType)
        const repairResult = await generateWithAI(
          repairPrompt,
          'You are an expert business analyst. Fix the validation errors.',
          { trackUsage: true }
        )
        const repairValidation = validateAssetContent(repairResult.content, file.fileType, file.fileName)
        if (repairValidation.valid) {
          finalContent = repairValidation.content || repairResult.content
          validation = repairValidation
        } else {
          finalContent = repairValidation.content || repairResult.content
          validation = repairValidation
        }
      } catch (repairError) {
        console.error(`[generate-case] Repair failed for ${file.fileId}:`, repairError)
      }
    }

    // Save to DB
    const mimeType = getMimeTypeForAsset(file.fileType)
    await upsertCaseFile({
      caseId,
      fileId: file.fileId,
      fileName: file.fileName,
      fileType: file.fileType,
      mimeType,
      content: finalContent,
      size: finalContent.length,
    })

    // Save local file for backwards compatibility
    try {
      const ext = getExtensionForAsset(file.fileType)
      const sourcesDir = path.join(process.cwd(), 'content', 'sources', caseId)
      if (!fs.existsSync(sourcesDir)) {
        fs.mkdirSync(sourcesDir, { recursive: true })
      }
      const baseName = file.fileName.replace(/\.[^.]+$/, '')
      const finalFileName = `${baseName}.${ext}`
      const filePath = path.join(sourcesDir, finalFileName)
      fs.writeFileSync(filePath, finalContent, 'utf-8')
    } catch (localError) {
      console.warn(`[generate-case] Failed to save local file for ${file.fileId}:`, localError)
    }

    const validationErrors = validation.errors || []
    
    // Log detailed metrics for observability
    let metrics: Record<string, any> = {
      chars: finalContent.length,
      validationErrors: validationErrors.length,
    }
    
    // Type-specific metrics
    if (file.fileType === 'PRESENTATION_DECK') {
      const slideCount = (finalContent.match(/\n---\n/g) || []).length + 1
      metrics.slides = slideCount
    } else if (file.fileType === 'FINANCIAL_DATA') {
      const rowCount = finalContent.split('\n').filter(l => l.trim()).length - 1 // minus header
      metrics.rows = rowCount
    } else if (file.fileType === 'STAKEHOLDER_PROFILES' || file.fileType === 'MARKET_DATASET') {
      try {
        const parsed = JSON.parse(finalContent)
        if (Array.isArray(parsed)) {
          metrics.entries = parsed.length
        }
      } catch {}
    } else if (['REPORT', 'INTERNAL_MEMO', 'PRESS_RELEASE', 'LEGAL_DOCUMENT', 'MEMO'].includes(file.fileType)) {
      const wordCount = finalContent.split(/\s+/).filter(w => w.length > 0).length
      const headingCount = (finalContent.match(/^#{1,2}\s+.+$/gm) || []).length
      metrics.words = wordCount
      metrics.headings = headingCount
    }
    
    console.info(`[generate-case] Generated ${file.fileId} (${file.fileType}):`, metrics)

    return {
      success: true,
      fileId: file.fileId,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      contentLength: finalContent.length,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[generate-case] Failed to generate ${file.fileId}:`, errorMsg)
    return {
      success: false,
      fileId: file.fileId,
      error: errorMsg,
    }
  }
}

interface GenerationOptions {
  provider: 'openai' | 'gemini'
  model: string
  includeVisualizations?: boolean
  includeMermaidDiagrams?: boolean
  targetWordCount?: number
  tone?: 'professional' | 'academic' | 'conversational'
}

interface GenerateCaseRequest {
  arenaId: string
  competencyName: string
  blueprintId?: string
  blueprintTitle?: string
  options: GenerationOptions
  caseId?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration?: number
  competencyIds?: string[] // Optional: competency IDs to associate with the case
}

/**
 * POST /api/content-generation/generate-case
 * Generate a case study from a blueprint
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateCaseRequest = await request.json()
    const {
      arenaId,
      competencyName,
      blueprintId,
      blueprintTitle,
      options,
      caseId,
      difficulty,
      estimatedDuration,
      competencyIds, // Optional: competency IDs from UI
    } = body
    
    // Use Gemini 2.5 Pro for HBR-quality generation
    const finalOptions = { ...options }
    if (finalOptions.provider === 'gemini') {
      // Force Gemini 2.5 Pro for high-quality case generation
      finalOptions.model = 'gemini-2.5-pro-latest'
      console.log('[generate-case] Using gemini-2.5-pro-latest for HBR-quality generation')
    }

    if (!arenaId || !competencyName || (!blueprintId && !blueprintTitle) || !options) {
      return NextResponse.json(
        { error: 'Missing required fields: arenaId, competencyName, blueprintId or blueprintTitle, options' },
        { status: 400 }
      )
    }

    // Load taxonomy
    const taxonomyPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'arenas.json')
    if (!fs.existsSync(taxonomyPath)) {
      return NextResponse.json(
        { error: 'Taxonomy not found. Run scripts/convert-case-blueprints.ts first.' },
        { status: 500 }
      )
    }

    const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf-8')
    const taxonomy = JSON.parse(taxonomyContent)

    // Find arena, competency, and blueprint
    const arena = taxonomy.arenas.find((a: any) => a.id === arenaId)
    if (!arena) {
      return NextResponse.json({ error: `Arena ${arenaId} not found` }, { status: 404 })
    }

    const competency = arena.competencies.find(
      (c: any) => c.name === competencyName || c.name.includes(competencyName)
    )
    if (!competency) {
      return NextResponse.json(
        { error: `Competency "${competencyName}" not found in ${arenaId}` },
        { status: 404 }
      )
    }

    const blueprint = blueprintId
      ? competency.blueprints.find((b: any) => b.id === blueprintId)
      : competency.blueprints.find((b: any) => b.title === blueprintTitle || b.title.includes(blueprintTitle || ''))

    if (!blueprint) {
      return NextResponse.json(
        { error: `Blueprint ${blueprintId || blueprintTitle} not found` },
        { status: 404 }
      )
    }

    // Load framework
    const frameworkPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'framework.json')
    const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
    const framework = JSON.parse(frameworkContent)

    // Step 1: Generate outline
    const outlinePrompt = buildCaseOutlinePrompt(blueprint, competency, framework)
    const outlineResult = await generateWithAI(
      outlinePrompt,
      'You are an expert business educator specializing in executive case study design.',
      {
        provider: finalOptions.provider,
        model: finalOptions.model,
        trackUsage: true,
      }
    )

    // Step 2: Generate full case JSON with retry logic
    const finalCaseId = caseId || `cs_${blueprint.id}_${Date.now()}`
    const casePrompt = buildCaseGenerationPrompt(
      outlineResult.content,
      blueprint,
      competency,
      framework,
      finalCaseId
    )

    // Generate case JSON with retry logic
    let caseData: any
    let caseJsonStr: string = ''
    const maxGenerationRetries = 3
    let generationAttempt = 0
    let generationSuccess = false

    while (generationAttempt < maxGenerationRetries && !generationSuccess) {
      generationAttempt++
      
      try {
        console.log(`[generate-case] Generating case JSON (attempt ${generationAttempt}/${maxGenerationRetries})...`)
        
        const caseResult = await generateWithAI(
          casePrompt + (generationAttempt > 1 ? '\n\nIMPORTANT: Output ONLY valid JSON. No markdown, no code fences, no explanations. Ensure all strings are properly escaped and all brackets/braces are balanced.' : ''),
          'You are an expert business educator specializing in executive case study design. Generate complete, realistic, challenging case study JSON structures. Output ONLY valid JSON - no markdown, no code fences, no explanations.',
          {
            provider: finalOptions.provider,
            model: finalOptions.model,
            trackUsage: true,
          }
        )

        caseJsonStr = caseResult.content.trim()
        
        // Parse JSON with repair attempts
        const parseResult = parseJSONWithRepair(caseJsonStr, 3)
        
        if (parseResult.success && parseResult.data) {
          caseData = parseResult.data
          generationSuccess = true
          
          if (parseResult.repairedStr) {
            console.log(`[generate-case] JSON successfully parsed after repair`)
          } else {
            console.log(`[generate-case] JSON parsed successfully on first attempt`)
          }
        } else {
          // Log detailed error information
          const errorPosition = parseResult.error?.match(/position (\d+)/)?.[1]
          const errorLine = parseResult.error?.match(/line (\d+)/)?.[1]
          
          console.error(`[generate-case] JSON parse failed (attempt ${generationAttempt}/${maxGenerationRetries}):`, parseResult.error)
          if (errorPosition) {
            const pos = parseInt(errorPosition)
            const start = Math.max(0, pos - 200)
            const end = Math.min(caseJsonStr.length, pos + 200)
            console.error(`[generate-case] Context around error (position ${pos}):`)
            console.error(`[generate-case] ...${caseJsonStr.substring(start, end)}...`)
          }
          if (errorLine) {
            const lines = caseJsonStr.split('\n')
            const lineNum = parseInt(errorLine)
            if (lineNum > 0 && lineNum <= lines.length) {
              console.error(`[generate-case] Error at line ${lineNum}:`, lines[lineNum - 1])
            }
          }
          
          // If this was the last attempt, return error
          if (generationAttempt >= maxGenerationRetries) {
            return NextResponse.json(
              { 
                error: 'Failed to generate valid JSON after multiple attempts',
                details: parseResult.error || 'Unknown parsing error',
                attempt: generationAttempt,
                rawOutputPreview: caseJsonStr.substring(0, 1000),
                errorContext: errorPosition ? {
                  position: parseInt(errorPosition),
                  context: caseJsonStr.substring(Math.max(0, parseInt(errorPosition) - 100), Math.min(caseJsonStr.length, parseInt(errorPosition) + 100))
                } : undefined
              },
              { status: 500 }
            )
          }
          
          // Wait before retry (exponential backoff)
          const retryDelay = Math.min(1000 * Math.pow(2, generationAttempt - 1), 5000)
          console.log(`[generate-case] Retrying in ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      } catch (generationError) {
        console.error(`[generate-case] Generation failed (attempt ${generationAttempt}/${maxGenerationRetries}):`, generationError)
        
        if (generationAttempt >= maxGenerationRetries) {
          return NextResponse.json(
            { 
              error: 'Failed to generate case JSON after multiple attempts',
              details: generationError instanceof Error ? generationError.message : 'Unknown error',
              attempt: generationAttempt
            },
            { status: 500 }
          )
        }
        
        // Wait before retry
        const retryDelay = Math.min(1000 * Math.pow(2, generationAttempt - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    if (!caseData) {
      return NextResponse.json(
        { error: 'Failed to generate valid case JSON' },
        { status: 500 }
      )
    }

    // Apply overrides
    if (difficulty) caseData.difficulty = difficulty
    if (estimatedDuration) caseData.estimatedDuration = estimatedDuration
    caseData.status = 'draft'
    caseData.caseId = finalCaseId

    // Validate HBR-quality requirements
    const caseValidationErrors: string[] = []
    
    // Check description length (800-1200+ words)
    if (!caseData.description || typeof caseData.description !== 'string') {
      caseValidationErrors.push('Description is missing or invalid')
    } else {
      const descWordCount = caseData.description.split(/\s+/).filter(w => w.length > 0).length
      if (descWordCount < 800) {
        caseValidationErrors.push(`Description too short: ${descWordCount} words, need at least 800 for HBR quality`)
      }
    }
    
    // Check stages (6-8 stages)
    if (!caseData.stages || !Array.isArray(caseData.stages)) {
      caseValidationErrors.push('Stages are missing or invalid')
    } else if (caseData.stages.length < 6) {
      caseValidationErrors.push(`Too few stages: ${caseData.stages.length}, need at least 6 for HBR quality`)
    } else if (caseData.stages.length > 8) {
      caseValidationErrors.push(`Too many stages: ${caseData.stages.length}, maximum 8`)
    }
    
    // Check rubric (8-10 criteria with 4 levels)
    if (!caseData.rubric || !caseData.rubric.criteria || !Array.isArray(caseData.rubric.criteria)) {
      caseValidationErrors.push('Rubric criteria are missing or invalid')
    } else {
      if (caseData.rubric.criteria.length < 8) {
        caseValidationErrors.push(`Too few rubric criteria: ${caseData.rubric.criteria.length}, need at least 8 for HBR quality`)
      }
      // Check each criterion has 4 performance levels
      caseData.rubric.criteria.forEach((criterion: any, idx: number) => {
        if (!criterion.scoringGuide) {
          caseValidationErrors.push(`Criterion ${idx}: missing scoringGuide`)
        } else {
          const requiredLevels = ['Unsatisfactory', 'Developing', 'Proficient', 'Exemplary']
          const hasAllLevels = requiredLevels.every(level => criterion.scoringGuide[level])
          if (!hasAllLevels) {
            caseValidationErrors.push(`Criterion ${idx}: missing required performance levels (need: ${requiredLevels.join(', ')})`)
          }
        }
      })
    }
    
    // Check datasets (at least 3)
    if (!caseData.datasets || !Array.isArray(caseData.datasets)) {
      caseValidationErrors.push('Datasets are missing or invalid')
    } else if (caseData.datasets.length < 3) {
      caseValidationErrors.push(`Too few datasets: ${caseData.datasets.length}, need at least 3 for HBR quality`)
    }
    
    // Check caseFiles
    if (!caseData.caseFiles || !Array.isArray(caseData.caseFiles) || caseData.caseFiles.length < 3) {
      caseValidationErrors.push(`Too few caseFiles: ${caseData.caseFiles?.length || 0}, need at least 3`)
    }
    
    // If validation fails, attempt repair/expansion
    if (caseValidationErrors.length > 0) {
      console.warn(`[generate-case] Case JSON validation failed: ${caseValidationErrors.join('; ')}`)
      console.info(`[generate-case] Attempting to repair/expand case JSON...`)
      
      try {
        const repairPrompt = `You generated a case study JSON, but it failed validation. Fix and EXPAND it to meet HBR-quality standards.

VALIDATION ERRORS:
${caseValidationErrors.map(e => `- ${e}`).join('\n')}

CURRENT CASE JSON:
${JSON.stringify(caseData, null, 2)}

REPAIR INSTRUCTIONS:
- EXPAND the description to 800-1200+ words with clear sections: executive summary, context, dilemma, alternatives, constraints, risks
- EXPAND to 6-8 detailed stages (currently ${caseData.stages?.length || 0})
- EXPAND rubric to 8-10 criteria with 4 performance levels each (Unsatisfactory, Developing, Proficient, Exemplary)
- ENSURE at least 3 datasets are included (currently ${caseData.datasets?.length || 0})
- Each stage description must be 150-250 words
- Each option description must be 100-150 words
- NO placeholders, NO empty sections
- Output ONLY valid JSON, no markdown, no code fences

Return the complete, expanded, HBR-quality case JSON.`
        
        const repairResult = await generateWithAI(
          repairPrompt,
          'You are an expert business educator. Fix and expand the case study to HBR-quality standards.',
          {
            provider: finalOptions.provider,
            model: finalOptions.model,
            trackUsage: true,
          }
        )
        
        let repairJsonStr = repairResult.content.trim()
        
        // Parse repaired JSON with repair attempts
        const repairParseResult = parseJSONWithRepair(repairJsonStr, 3)
        
        if (repairParseResult.success && repairParseResult.data) {
          caseData = repairParseResult.data
          console.info(`[generate-case] Case JSON repair successful`)
        } else {
          console.error(`[generate-case] Failed to parse repaired case JSON:`, repairParseResult.error)
          return NextResponse.json(
            { 
              error: 'Case generation failed validation and repair attempt failed',
              details: caseValidationErrors,
              repairError: repairParseResult.error,
              repairPreview: repairJsonStr.substring(0, 500)
            },
            { status: 422 }
          )
        }
      } catch (repairError) {
        console.error(`[generate-case] Case JSON repair failed:`, repairError)
        return NextResponse.json(
          { error: 'Case generation failed validation and could not be repaired', details: caseValidationErrors },
          { status: 422 }
        )
      }
    }

    // Get current user for DB operations
    const user = await getCurrentUser()
    const userId = user?.id || null

    // Convert briefing object to markdown string for briefingDoc
    let briefingDoc: string | null = null
    if (caseData.briefing) {
      if (typeof caseData.briefing === 'string') {
        briefingDoc = caseData.briefing
      } else if (typeof caseData.briefing === 'object') {
        const briefingParts: string[] = []
        if (caseData.briefing.overview) {
          briefingParts.push(`## Overview\n\n${caseData.briefing.overview}`)
        }
        if (caseData.briefing.context) {
          briefingParts.push(`## Context\n\n${caseData.briefing.context}`)
        }
        if (caseData.briefing.background) {
          briefingParts.push(`## Background\n\n${caseData.briefing.background}`)
        }
        if (caseData.briefing.scenario) {
          briefingParts.push(`## Scenario\n\n${caseData.briefing.scenario}`)
        }
        // Add any other briefing fields
        Object.keys(caseData.briefing).forEach(key => {
          if (!['overview', 'context', 'background', 'scenario'].includes(key)) {
            const value = caseData.briefing[key]
            if (value && typeof value === 'string') {
              const heading = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
              briefingParts.push(`## ${heading}\n\n${value}`)
            }
          }
        })
        briefingDoc = briefingParts.join('\n\n') || JSON.stringify(caseData.briefing, null, 2)
      }
    } else if (caseData.description) {
      briefingDoc = caseData.description
    }

    // Save case to DB
    // Verify user exists before setting FK references (avoid constraint violation)
    let verifiedUserId: string | undefined = undefined
    if (userId) {
      try {
        const { prisma } = await import('@/lib/prisma/server')
        const userExists = await prisma.profile.findUnique({
          where: { id: userId },
          select: { id: true },
        })
        if (userExists) {
          verifiedUserId = userId
        } else {
          console.warn(`[generate-case] User ${userId} not found, creating case without user reference`)
        }
      } catch (err) {
        console.warn('[generate-case] Failed to verify user, creating case without user reference:', err)
      }
    }
    
    // Prepare case files for atomic transaction
    const caseFiles: CaseFileInput[] = []
    if (caseData.caseFiles && Array.isArray(caseData.caseFiles) && caseData.caseFiles.length > 0) {
      caseFiles.push(...caseData.caseFiles
        .filter((file: any) => file && file.fileId && file.fileName) // Filter out invalid files
        .map((file: any) => {
          const isCSV = file.fileType === 'FINANCIAL_DATA'
          const mimeType = isCSV ? 'text/csv' : file.fileName?.endsWith('.json') ? 'application/json' : 'text/markdown'
          
          return {
            caseId: '', // Will be set by createCaseWithFiles
            fileId: file.fileId,
            fileName: file.fileName,
            fileType: file.fileType || 'UNKNOWN',
            mimeType,
            content: file.source?.type === 'STATIC' ? file.source.content : null,
            size: file.source?.type === 'STATIC' && file.source.content ? file.source.content.length : null,
          }
        }))
    }

    // Create case and files atomically in a single transaction
    // If any part fails, the entire operation is rolled back
    let createdCase: any
    let createdFiles: any[] = []
    
    try {
      // Use competencyIds from request if provided, otherwise empty array
      const finalCompetencyIds = competencyIds && Array.isArray(competencyIds) && competencyIds.length > 0
        ? competencyIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
        : []
      
      const result = await createCaseWithFiles({
        title: caseData.title,
        briefingDoc,
        description: caseData.description || caseData.briefing?.overview || null,
        datasets: caseData.datasets || null,
        rubric: caseData.rubric || {},
        status: caseData.status || 'draft',
        published: caseData.published ?? false,
        difficulty: caseData.difficulty || 'intermediate',
        estimatedMinutes: caseData.estimatedDuration || 60,
        prerequisites: caseData.prerequisites || [],
        metadata: {
          competencies: caseData.competencies || [],
          persona: caseData.persona || {},
          arenaId,
          competencyName: competency.name,
          blueprintId,
          caseId: finalCaseId,
          ...caseData.metadata,
        },
        competencyIds: finalCompetencyIds, // Use competencyIds from UI selection
        createdBy: verifiedUserId || '', // Empty string if no user (will be set to null in createCaseWithFiles)
        updatedBy: verifiedUserId || '', // Empty string if no user (will be set to null in createCaseWithFiles)
      }, caseFiles)
      
      createdCase = result.case
      createdFiles = result.files || []
    } catch (transactionError: any) {
      // Transaction failed - this means case AND files were NOT saved (rolled back)
      // Provide clear error message
      console.error('[generate-case] Transaction failed:', transactionError)
      
      // Re-throw with helpful message for specific error types
      if (transactionError.code === 'P2021' || transactionError.message?.includes('Table does not exist')) {
        throw new Error('case_files table does not exist. Please run: npm run db:push')
      }
      // Handle duplicate case error (from createCaseWithFiles)
      if (transactionError.message?.includes('already exists') || transactionError.message?.includes('blueprint ID')) {
        throw transactionError // Pass through the duplicate error message
      }
      throw transactionError
    }

    const dbCaseId = createdCase.id

    // Save to local data directory for backwards compatibility (optional)
    const dataDir = path.join(process.cwd(), 'data', 'case-studies')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const localCasePath = path.join(dataDir, `${finalCaseId}.json`)
    fs.writeFileSync(localCasePath, JSON.stringify(caseData, null, 2), 'utf-8')

    // Generate thumbnail (optional, non-blocking)
    let thumbnailUrl: string | null = null
    if (dbCaseId && isSupabaseAvailable()) {
      try {
        await generateAndUploadThumbnail(
          dbCaseId,
          'case',
          caseData.title,
          arena.theme,
          competency.name
        )
      } catch (thumbError) {
        console.warn('Thumbnail generation failed:', thumbError)
      }
    }

    // Generate all assets synchronously and sequentially BEFORE returning response
    const generateResults: Array<{
      success: boolean
      fileId: string
      error?: string
      validationErrors?: string[]
      contentLength?: number
    }> = []

    if (dbCaseId && createdFiles.length > 0) {
      const filesNeedingGeneration = createdFiles.filter((f: any) => !f.content || f.content.length === 0)
      if (filesNeedingGeneration.length > 0) {
        console.info(`[generate-case] Generating ${filesNeedingGeneration.length} assets synchronously (sequential)`)
        
        // Generate sequentially - one at a time
        for (const file of filesNeedingGeneration) {
          const result = await generateSingleAssetSync(
            dbCaseId,
            {
              fileId: file.fileId,
              fileName: file.fileName,
              fileType: file.fileType,
            },
            caseData,
            blueprint,
            competency,
            framework
          )
          generateResults.push(result)
        }
        
        const successCount = generateResults.filter(r => r.success).length
        const failCount = generateResults.filter(r => !r.success).length
        const totalWarnings = generateResults.reduce((sum, r) => sum + (r.validationErrors?.length || 0), 0)
        console.info(`[generate-case] Completed asset generation: ${successCount} succeeded, ${failCount} failed, ${totalWarnings} total warnings`)
        
        // Log case-level metrics
        const descWordCount = caseData.description?.split(/\s+/).filter((w: string) => w.length > 0).length || 0
        console.info(`[generate-case] Case metrics:`, {
          descriptionWords: descWordCount,
          stages: caseData.stages?.length || 0,
          rubricCriteria: caseData.rubric?.criteria?.length || 0,
          datasets: caseData.datasets?.length || 0,
          caseFiles: caseData.caseFiles?.length || 0,
        })
      }
    }

    // Re-fetch files from DB to get final state (with generated content)
    const { listCaseFiles } = await import('@/lib/db/cases')
    const finalFiles = await listCaseFiles(dbCaseId)
    
    // Use files from DB (now with generated content)
    const finalCaseFiles = (finalFiles || []).map((f: any) => ({
      fileId: f.fileId,
      fileName: f.fileName,
      fileType: f.fileType,
      source: {
        type: f.content && f.content.length > 0 ? 'STATIC' : 'REFERENCE',
        content: f.content || null,
      }
    }))

    // Update caseData to include files from DB
    const caseDataWithFiles = {
      ...caseData,
      caseFiles: finalCaseFiles,
    }

    return NextResponse.json({
      case: caseDataWithFiles, // Include caseFiles in the main case object for preview
      caseId: dbCaseId,
      thumbnailUrl,
      generateResults, // Include generation results for each asset
      // Include full case data for reference
      caseData: {
        title: caseData.title,
        description: caseData.description || caseData.briefing?.overview || '',
        rubric: caseData.rubric || {},
        briefingDoc,
        datasets: caseData.datasets || null,
        difficulty: caseData.difficulty || 'intermediate',
        estimatedMinutes: caseData.estimatedDuration || 60,
        prerequisites: caseData.prerequisites || [],
        metadata: {
          competencies: caseData.competencies || [],
          persona: caseData.persona || {},
          arenaId,
          competencyName: competency.name,
          blueprintId,
          caseId: finalCaseId, // Include caseId for duplicate detection in bulk save
          ...caseData.metadata,
        },
        status: caseData.status || 'draft',
        // Include caseFiles from DB (now with generated content)
        caseFiles: finalCaseFiles,
      },
    })
  } catch (error: any) {
    console.error('[generate-case] Error generating case:', error)
    
    // Provide specific error messages for common issues
    let errorMessage = 'Failed to generate case'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'
    
    // Check for database schema issues
    if (error.code === 'P2021' || error.message?.includes('Table does not exist')) {
      errorMessage = 'Database schema is out of date'
      errorDetails = 'The case_files table does not exist. Please run `npm run db:push` to update the database schema.'
    } else if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
      errorMessage = 'Database constraint violation'
      errorDetails = 'A referenced record (user, competency, etc.) does not exist. Please check your data.'
    } else if (error.code === 'P1017' || error.message?.includes('Server has closed the connection')) {
      errorMessage = 'Database connection lost'
      errorDetails = 'The database connection was interrupted. Please try again.'
    } else if (error.message?.includes('already exists') || error.message?.includes('blueprint ID')) {
      // Duplicate case error - provide clear message
      errorMessage = 'Case already exists'
      errorDetails = error.message // Include the full error message with blueprint ID and case title
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    )
  }
}

