import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { buildAssetGenerationPrompt } from '@/lib/case-generation-prompts'
import { generateWithAI } from '@/scripts/generate-shared'
import { getCaseById, upsertCaseFile, getCaseFile } from '@/lib/db/cases'
import { validateCaseId } from '@/lib/case-id'
import { getMimeTypeForAsset, getExtensionForAsset } from '@/lib/asset-utils'

export const runtime = 'nodejs'

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean
  errors: string[]
  content?: string // Optionally cleaned content
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

  // Type-specific validation
  switch (fileType) {
    case 'PRESENTATION_DECK': {
      // Check for Marp frontmatter
      if (!/^---\s*\n[\s\S]*?\n---\s*\n/.test(cleanedContent)) {
        errors.push('Missing Marp frontmatter (must start with ---\\n...\\n---\\n)')
      }

      // Count slide separators (should be 11-15 for 12-16 slides for HBR quality)
      const slideSeparators = (cleanedContent.match(/\n---\n/g) || []).length
      if (slideSeparators < 11) {
        errors.push(`Too few slides: found ${slideSeparators + 1}, need at least 12 for HBR quality`)
      } else if (slideSeparators > 15) {
        errors.push(`Too many slides: found ${slideSeparators + 1}, need at most 16`)
      }
      break
    }

    case 'FINANCIAL_DATA': {
      const lines = cleanedContent.split('\n').filter(line => line.trim())
      if (lines.length < 17) {
        errors.push(`Too few rows: found ${lines.length}, need at least 17 (1 header + 16 data rows) for HBR quality`)
      } else {
        // Check header
        const header = lines[0]
        if (!header.includes(',')) {
          errors.push('CSV header missing or invalid (no commas found)')
        } else {
          const headerCols = header.split(',').length
          if (headerCols < 2) {
            errors.push('CSV header must have at least 2 columns')
          }
        }
      }
      break
    }

    case 'STAKEHOLDER_PROFILES': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (!Array.isArray(parsed)) {
          errors.push('Must be a top-level JSON array, not an object')
        } else {
          if (parsed.length < 5 || parsed.length > 7) {
            errors.push(`Array length must be 5-7 for HBR quality, found ${parsed.length}`)
          }
          parsed.forEach((item: any, idx: number) => {
            if (!item.name || typeof item.name !== 'string') {
              errors.push(`Item ${idx}: missing or invalid 'name' field`)
            }
            if (!item.title || typeof item.title !== 'string') {
              errors.push(`Item ${idx}: missing or invalid 'title' field`)
            }
            if (!item.role || typeof item.role !== 'string') {
              errors.push(`Item ${idx}: missing or invalid 'role' field`)
            }
            if (!item.power || !['low', 'medium', 'high'].includes(item.power)) {
              errors.push(`Item ${idx}: missing or invalid 'power' field (must be 'low', 'medium', or 'high')`)
            }
            if (!item.influence || !['low', 'medium', 'high'].includes(item.influence)) {
              errors.push(`Item ${idx}: missing or invalid 'influence' field (must be 'low', 'medium', or 'high')`)
            }
            if (!Array.isArray(item.concerns) || item.concerns.length < 3) {
              errors.push(`Item ${idx}: 'concerns' must be an array with at least 3 items`)
            }
            if (!Array.isArray(item.motivations) || item.motivations.length < 3) {
              errors.push(`Item ${idx}: 'motivations' must be an array with at least 3 items`)
            }
            if (!Array.isArray(item.likely_objections) || item.likely_objections.length < 2) {
              errors.push(`Item ${idx}: 'likely_objections' must be an array with at least 2 items`)
            }
          })
        }
      } catch (e) {
        errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`)
      }
      break
    }

    case 'MARKET_DATASET': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (!Array.isArray(parsed)) {
          errors.push('Must be a JSON array')
        } else {
          if (parsed.length < 24) {
            errors.push(`Array must have at least 24 items for HBR quality, found ${parsed.length}`)
          }
          parsed.forEach((item: any, idx: number) => {
            if (typeof item !== 'object' || item === null) {
              errors.push(`Item ${idx}: must be an object`)
            } else {
              const hasTimeKey = ['date', 'period', 'month', 'quarter', 'year'].some(
                key => key in item
              )
              if (!hasTimeKey) {
                errors.push(`Item ${idx}: missing time key (date/period/month/quarter/year)`)
              }
              const numericKeys = Object.keys(item).filter(
                k => typeof item[k] === 'number' && k !== 'meta'
              )
              if (numericKeys.length < 2) {
                errors.push(`Item ${idx}: must have at least 2 numeric metric keys`)
              }
            }
          })
        }
      } catch (e) {
        errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`)
      }
      break
    }

    case 'ORG_CHART': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          errors.push('Must be a JSON object (not array)')
        } else {
          if (!parsed.organization || !Array.isArray(parsed.organization)) {
            errors.push("Missing or invalid 'organization' array")
          } else {
            // Count total employees recursively
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
            const totalEmployees = countEmployees(parsed.organization)
            if (totalEmployees < 12) {
              errors.push(`Organization must have at least 12 employees for HBR quality, found ${totalEmployees}`)
            } else if (totalEmployees > 20) {
              errors.push(`Organization has too many employees: ${totalEmployees}, maximum 20`)
            }
          }
        }
      } catch (e) {
        errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`)
      }
      break
    }

    case 'REPORT':
    case 'INTERNAL_MEMO':
    case 'PRESS_RELEASE':
    case 'LEGAL_DOCUMENT':
    case 'MEMO': {
      // Count words (approximate: split by whitespace)
      const wordCount = cleanedContent.split(/\s+/).filter(w => w.length > 0).length
      if (wordCount < 900) {
        errors.push(`Content too short: ${wordCount} words, need at least 900 words for HBR quality`)
      }
      // Count headings
      const headingMatches = cleanedContent.match(/^#{1,2}\s+.+$/gm) || []
      if (headingMatches.length < 5) {
        errors.push(`Missing headings: found ${headingMatches.length}, need at least 5 headings for HBR quality`)
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

VALIDATION FAILED - Errors:
${validationErrors.map(e => `- ${e}`).join('\n')}

REPAIR: Fix all errors above. ${needsExpansion ? 'EXPAND content to meet thresholds (more detail/data/sections).' : ''} Match output format exactly. No code fences/explanations. Output ONLY corrected raw content.

Regenerate ${fileType} "${assetName}" with errors fixed.`
}

/**
 * POST /api/case-generation/generate-asset
 * Generate or regenerate a single case file asset
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const debugMode = request.headers.get('x-debug') === 'true' || process.env.NEXT_PUBLIC_DEBUG_ASSETS === 'true'
  const validationMode = (process.env.ASSET_VALIDATION_MODE || 'warn').toLowerCase() as 'warn' | 'strict'

  try {
    const body = await request.json()
    
    console.info(`[generate-asset:${requestId}] START`, {
      caseId: body?.caseId,
      fileId: body?.fileId,
      isNew: body?.new,
      type: body?.type,
      fileName: body?.fileName,
      validationMode,
    })
    const {
      caseId: caseIdParam,
      fileId,
      new: isNew,
      type,
      fileName,
      overwrite = false,
    } = body

    // Validate caseId
    const caseIdValidation = validateCaseId(caseIdParam)
    if (!caseIdValidation.valid) {
      console.error(`[generate-asset:${requestId}] Invalid caseId:`, caseIdValidation.error)
      return NextResponse.json(
        { error: caseIdValidation.error || 'Invalid or missing caseId' },
        { status: 400 }
      )
    }

    if (!fileId && !isNew) {
      return NextResponse.json(
        { error: 'Missing required: either fileId or new asset specs' },
        { status: 400 }
      )
    }

    const caseId = caseIdValidation.caseId!

    // Load case from DB
    const dbCase = await getCaseById(caseId)
    if (!dbCase) {
      return NextResponse.json(
        { error: 'Case not found in database' },
        { status: 404 }
      )
    }

    // Load case JSON from local file for blueprint context (if available)
    const casePath = path.join(process.cwd(), 'data', 'case-studies', `${caseId}.json`)
    let caseData: any = null
    if (fs.existsSync(casePath)) {
      try {
        const caseContent = fs.readFileSync(casePath, 'utf-8')
        caseData = JSON.parse(caseContent)
      } catch (err) {
        console.warn('Failed to load local case file:', err)
      }
    }

    // If no local file, construct minimal caseData from DB metadata
    if (!caseData) {
      caseData = {
        title: dbCase.title,
        description: dbCase.description,
        competencies: (dbCase.metadata as any)?.competencies || [],
        caseFiles: [],
      }
    }

    // Find or create asset entry
    let asset: any
    let existingFile = null
    
    if (!isNew && fileId) {
      // Check if file exists in DB
      existingFile = await getCaseFile(caseId, fileId)
      if (existingFile) {
        asset = {
          fileId: existingFile.fileId,
          fileName: existingFile.fileName,
          fileType: existingFile.fileType,
          source: existingFile.content ? { type: 'STATIC', content: existingFile.content } : { type: 'REFERENCE', path: null },
        }
      } else {
        // Try to find in caseData.caseFiles
        asset = caseData.caseFiles?.find((f: any) => f.fileId === fileId)
        if (!asset) {
          return NextResponse.json(
            { error: `File ${fileId} not found in case` },
            { status: 404 }
          )
        }
      }
    } else if (isNew) {
      if (!type || !fileName) {
        return NextResponse.json(
          { error: 'New asset requires type and fileName' },
          { status: 400 }
        )
      }
      
      asset = {
        fileId: fileName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        fileName,
        fileType: type,
        source: { type: 'STATIC', content: '' },
      }
    }

    // Check if we should overwrite
    if (!isNew && existingFile && existingFile.content && !overwrite) {
      return NextResponse.json(
        { error: 'File already has content. Set overwrite=true to regenerate.' },
        { status: 400 }
      )
    }

    // Find blueprint for context (assume first competency for now)
    const taxonomyPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'arenas.json')
    const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf-8')
    const taxonomy = JSON.parse(taxonomyContent)

    // Try to find matching blueprint
    let blueprint: any = null
    let competency: any = null
    
    for (const arena of taxonomy.arenas) {
      for (const comp of arena.competencies) {
        const match = comp.blueprints.find((b: any) => 
          caseData.title?.includes(b.title) || 
          caseId.includes(b.id)
        )
        if (match) {
          blueprint = match
          competency = comp
          break
        }
      }
      if (blueprint) break
    }

    // Load framework
    const frameworkPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'framework.json')
    const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
    const framework = JSON.parse(frameworkContent)

    // Generate asset content
    const assetPrompt = buildAssetGenerationPrompt(
      asset.fileName.replace(/\.[^.]+$/, ''), // Remove extension for prompt
      asset.fileType as any,
      blueprint || { title: caseData.title || '', dilemma: caseData.description || '', task: '', assets: [] },
      competency || { name: caseData.competencies?.[0] || 'Strategic Thinking', primaryChallengeType: '', secondaryTypes: [], blueprints: [] },
      framework
    )

    // Generate asset content (with retry on validation failure)
    console.info(`[generate-asset:${requestId}] Generating content for ${asset.fileName} (${asset.fileType})`)
    let result = await generateWithAI(
      assetPrompt,
      'You are an expert business analyst creating realistic case study materials.',
      { trackUsage: true }
    )

    console.info(`[generate-asset:${requestId}] Generated content`, {
      model: result.model,
      contentLength: result.content.length,
      firstChars: result.content.substring(0, 100),
    })

    // Validate and optionally repair
    let validation = validateAssetContent(result.content, asset.fileType, asset.fileName)
    let finalContent = validation.content || result.content

    // If validation failed, attempt one repair
    if (!validation.valid) {
      console.warn(`[generate-asset:${requestId}] Validation failed:`, validation.errors)
      const repairPrompt = buildRepairPrompt(assetPrompt, validation.errors, asset.fileName, asset.fileType)
      
      try {
        console.info(`[generate-asset:${requestId}] Attempting repair generation`)
        const repairResult = await generateWithAI(
          repairPrompt,
          'You are an expert business analyst creating realistic case study materials. Fix the validation errors.',
          { trackUsage: true }
        )
        
        const repairValidation = validateAssetContent(repairResult.content, asset.fileType, asset.fileName)
        if (repairValidation.valid) {
          finalContent = repairValidation.content || repairResult.content
          validation = repairValidation
          result = repairResult
          console.info(`[generate-asset:${requestId}] Repair successful`)
        } else {
          console.warn(`[generate-asset:${requestId}] Repair also failed:`, repairValidation.errors)
          // Use repair result anyway, but validation will fail
          finalContent = repairValidation.content || repairResult.content
          validation = repairValidation
        }
      } catch (repairError) {
        console.error(`[generate-asset:${requestId}] Repair generation failed:`, repairError)
        // Continue with original content
      }
    }

    // Handle validation based on mode
    const validationErrors = validation.errors || []
    const hasValidationErrors = !validation.valid

    if (hasValidationErrors && validationMode === 'strict') {
      console.error(`[generate-asset:${requestId}] Validation failed (strict mode) - returning 422`)
      return NextResponse.json(
        {
          error: 'Generated content failed validation',
          details: validationErrors,
          validationErrors,
          contentPreview: finalContent.substring(0, 300),
          content: debugMode ? finalContent.substring(0, 300) : undefined,
        },
        { status: 422 }
      )
    }

    // In warn mode, save content even with validation errors
    if (hasValidationErrors) {
      console.warn(`[generate-asset:${requestId}] Validation warnings (warn mode) - saving anyway:`, validationErrors)
    }

    // Determine mime type
    const mimeType = getMimeTypeForAsset(asset.fileType)
    
    // Save to DB
    console.info(`[generate-asset:${requestId}] Saving to database`)
    const savedFile = await upsertCaseFile({
      caseId,
      fileId: asset.fileId,
      fileName: asset.fileName,
      fileType: asset.fileType,
      mimeType,
      content: finalContent,
      size: finalContent.length,
    })

    // Post-upsert verification: re-fetch to ensure it was saved
    try {
      const verifyFile = await getCaseFile(caseId, asset.fileId)
      if (!verifyFile) {
        console.error(`[generate-asset:${requestId}] VERIFICATION FAILED: File not found after upsert`)
      } else if (!verifyFile.content) {
        console.error(`[generate-asset:${requestId}] VERIFICATION FAILED: File exists but content is null`)
      } else {
        console.info(`[generate-asset:${requestId}] Verification passed: file exists with ${verifyFile.content.length} chars, mimeType: ${verifyFile.mimeType}`)
      }
    } catch (verifyError) {
      console.error(`[generate-asset:${requestId}] Verification error:`, verifyError)
    }

    // Optionally save to local file for backwards compatibility
    if (fs.existsSync(path.dirname(casePath))) {
      try {
        const ext = getExtensionForAsset(asset.fileType)
        const sourcesDir = path.join(process.cwd(), 'content', 'sources', caseId)
        if (!fs.existsSync(sourcesDir)) {
          fs.mkdirSync(sourcesDir, { recursive: true })
        }
        // Normalize file extension
        const baseName = asset.fileName.replace(/\.[^.]+$/, '')
        const finalFileName = `${baseName}.${ext}`
        const filePath = path.join(sourcesDir, finalFileName)
        fs.writeFileSync(filePath, finalContent, 'utf-8')
        console.info(`[generate-asset:${requestId}] Saved local file: ${finalFileName}`)
      } catch (localError) {
        console.warn(`[generate-asset:${requestId}] Failed to save local file:`, localError)
        // Continue - DB is the source of truth
      }
    }

    const duration = Date.now() - startTime
    console.info(`[generate-asset:${requestId}] SUCCESS`, {
      duration: `${duration}ms`,
      fileId: savedFile.fileId,
      size: savedFile.size,
      hasValidationErrors,
      validationErrorCount: validationErrors.length,
    })

    return NextResponse.json({
      success: true,
      fileId: savedFile.fileId,
      fileName: savedFile.fileName,
      fileType: savedFile.fileType,
      mimeType: savedFile.mimeType,
      size: savedFile.size,
      content: debugMode ? finalContent.substring(0, 300) : finalContent.substring(0, 500) + '...',
      validationErrors: hasValidationErrors ? validationErrors : undefined,
      warnings: hasValidationErrors ? validationErrors : undefined,
      lastGeneration: {
        model: result.model,
        timestamp: new Date().toISOString(),
        validationErrors: hasValidationErrors ? validationErrors : [],
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[generate-asset:${requestId}] ERROR after ${duration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to generate asset',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  }
}


