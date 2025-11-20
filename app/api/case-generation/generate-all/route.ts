import { NextRequest, NextResponse } from 'next/server'
import { getCaseById, listCaseFiles, upsertCaseFile, getCaseFile } from '@/lib/db/cases'
import { validateCaseId } from '@/lib/case-id'
import { buildAssetGenerationPrompt } from '@/lib/case-generation-prompts'
import { generateWithAI } from '@/scripts/generate-shared'
import { getMimeTypeForAsset, getExtensionForAsset } from '@/lib/asset-utils'
import fs from 'fs'
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

  // Type-specific validation (simplified - full validation in generate-asset route)
  switch (fileType) {
    case 'PRESENTATION_DECK': {
      const hasFrontmatter = /^---\s*\n[\s\S]*?\n---\s*\n/.test(cleanedContent)
      const hasSeparators = cleanedContent.includes('\n---\n')
      if (!hasFrontmatter) {
        errors.push('Missing Marp frontmatter')
      }
      if (!hasSeparators) {
        errors.push('Missing slide separators (---)')
      }
      break
    }
    case 'FINANCIAL_DATA': {
      const lines = cleanedContent.split('\n').filter(l => l.trim())
      if (lines.length < 13) {
        errors.push(`Insufficient rows: expected at least 13, got ${lines.length}`)
      }
      break
    }
    case 'STAKEHOLDER_PROFILES': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (!Array.isArray(parsed)) {
          errors.push('Must be a JSON array')
        } else if (parsed.length < 3 || parsed.length > 6) {
          errors.push(`Array length must be 3-6, got ${parsed.length}`)
        }
      } catch {
        errors.push('Invalid JSON format')
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
  return `${originalPrompt}

VALIDATION FAILED - Errors:
${validationErrors.map(e => `- ${e}`).join('\n')}

REPAIR: Fix all errors. Match output format exactly. No code fences/explanations. Output ONLY corrected raw content.

Regenerate ${fileType} "${assetName}" with errors fixed.`
}

/**
 * Generate a single asset with retry and validation
 */
async function generateSingleAsset(
  caseId: string,
  file: { fileId: string; fileName: string; fileType: string },
  caseData: any,
  blueprint: any,
  competency: any,
  framework: any,
  requestId: string
): Promise<{
  success: boolean
  fileId: string
  error?: string
  validationErrors?: string[]
  contentLength?: number
}> {
  try {
    // Skip if already has content (idempotency)
    const existing = await getCaseFile(caseId, file.fileId)
    if (existing?.content && existing.content.length > 0) {
      console.info(`[generate-all:${requestId}] Skipping ${file.fileId} - already has content`)
      return { success: true, fileId: file.fileId, contentLength: existing.content.length }
    }

    console.info(`[generate-all:${requestId}] Generating ${file.fileName} (${file.fileType})`)

    // Build prompt
    const assetPrompt = buildAssetGenerationPrompt(
      file.fileName,
      file.fileType as any,
      blueprint || { title: caseData.title || '', dilemma: caseData.description || '', task: '', assets: [] },
      competency || { name: caseData.competencies?.[0] || 'Strategic Thinking', primaryChallengeType: '', secondaryTypes: [], blueprints: [] },
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
        console.warn(`[generate-all:${requestId}] Validation failed for ${file.fileId}, attempting repair`)
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
        console.error(`[generate-all:${requestId}] Repair failed for ${file.fileId}:`, repairError)
      }
    }

    // Save to DB (warn mode - save even with validation errors)
    const mimeType = getMimeTypeForAsset(file.fileType)
    const savedFile = await upsertCaseFile({
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
      console.warn(`[generate-all:${requestId}] Failed to save local file for ${file.fileId}:`, localError)
    }

    const validationErrors = validation.errors || []
    console.info(`[generate-all:${requestId}] Generated ${file.fileId}: ${finalContent.length} chars, ${validationErrors.length} warnings`)

    return {
      success: true,
      fileId: file.fileId,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      contentLength: finalContent.length,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[generate-all:${requestId}] Failed to generate ${file.fileId}:`, errorMsg)
    return {
      success: false,
      fileId: file.fileId,
      error: errorMsg,
    }
  }
}

/**
 * POST /api/case-generation/generate-all
 * Generate all assets for a case in parallel
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `gen-all-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const validationMode = (process.env.ASSET_VALIDATION_MODE || 'warn').toLowerCase() as 'warn' | 'strict'

  try {
    const { searchParams } = new URL(request.url)
    const caseIdParam = searchParams.get('caseId')
    const forceParam = searchParams.get('force')
    const force = forceParam === 'true'

    // Validate caseId
    const validation = validateCaseId(caseIdParam)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid caseId' },
        { status: 400 }
      )
    }

    const caseId = validation.caseId!

    console.info(`[generate-all:${requestId}] START`, { caseId, force, validationMode })

    // Load case
    const dbCase = await getCaseById(caseId)
    if (!dbCase) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      )
    }

    // Load case files
    const files = await listCaseFiles(caseId)
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files found for case' },
        { status: 404 }
      )
    }

    // Filter files to generate
    const filesToGenerate = force
      ? files
      : files.filter(f => !f.content || f.content.length === 0)

    if (filesToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All assets already generated',
        total: files.length,
        generated: 0,
        skipped: files.length,
        results: [],
      })
    }

    console.info(`[generate-all:${requestId}] Generating ${filesToGenerate.length} of ${files.length} files`)

    // Load case data for prompts
    const casePath = path.join(process.cwd(), 'data', 'case-studies', `${caseId}.json`)
    let caseData: any = null
    let blueprint: any = null
    let competency: any = null
    let framework: any = null

    if (fs.existsSync(casePath)) {
      try {
        caseData = JSON.parse(fs.readFileSync(casePath, 'utf-8'))
        blueprint = caseData.blueprint || { title: caseData.title || '', dilemma: caseData.description || '', task: '', assets: [] }
        competency = caseData.competency || { name: caseData.competencies?.[0] || 'Strategic Thinking', primaryChallengeType: '', secondaryTypes: [], blueprints: [] }
        framework = caseData.framework || null
      } catch (parseError) {
        console.warn(`[generate-all:${requestId}] Failed to parse case JSON:`, parseError)
      }
    }

    // If no case data, use DB case data
    if (!caseData) {
      caseData = {
        title: dbCase.title,
        description: dbCase.description,
        competencies: (dbCase.metadata as any)?.competencies || [],
        rubric: dbCase.rubric,
      }
    }

    // Generate assets in parallel with bounded concurrency
    const CONCURRENCY = 3
    const results: Array<{
      success: boolean
      fileId: string
      error?: string
      validationErrors?: string[]
      contentLength?: number
    }> = []

    for (let i = 0; i < filesToGenerate.length; i += CONCURRENCY) {
      const batch = filesToGenerate.slice(i, i + CONCURRENCY)
      const batchResults = await Promise.all(
        batch.map(file =>
          generateSingleAsset(
            caseId,
            file,
            caseData,
            blueprint,
            competency,
            framework,
            requestId
          )
        )
      )
      results.push(...batchResults)
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    const totalWarnings = results.reduce((sum, r) => sum + (r.validationErrors?.length || 0), 0)

    const duration = Date.now() - startTime
    console.info(`[generate-all:${requestId}] COMPLETE`, {
      duration: `${duration}ms`,
      total: files.length,
      generated: filesToGenerate.length,
      success: successCount,
      failed: failCount,
      warnings: totalWarnings,
    })

    return NextResponse.json({
      success: true,
      total: files.length,
      generated: filesToGenerate.length,
      successCount,
      failCount,
      skipped: files.length - filesToGenerate.length,
      results,
      duration: `${duration}ms`,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[generate-all:${requestId}] ERROR after ${duration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to generate assets',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    )
  }
}

