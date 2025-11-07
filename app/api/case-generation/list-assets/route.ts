import { NextRequest, NextResponse } from 'next/server'
import { getCaseById, listCaseFiles } from '@/lib/db/cases'
import { validateCaseId } from '@/lib/case-id'

export const runtime = 'nodejs'

/**
 * GET /api/case-generation/list-assets
 * List all case files for a case study from database
 * Returns file metadata with preview content (truncated to 2000 chars)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { searchParams } = new URL(request.url)
    const caseIdParam = searchParams.get('caseId')
    
    console.info(`[list-assets:${requestId}] START`, { caseId: caseIdParam })

    // Validate caseId using centralized utility
    const validation = validateCaseId(caseIdParam)
    if (!validation.valid) {
      console.error(`[list-assets:${requestId}] Invalid caseId:`, validation.error)
      return NextResponse.json(
        { error: validation.error || 'Invalid or missing caseId query parameter' },
        { status: 400 }
      )
    }

    const caseId = validation.caseId!

    // Load case from DB
    const dbCase = await getCaseById(caseId)
    if (!dbCase) {
      console.error('[list-assets] Case not found:', caseId)
      return NextResponse.json(
        { error: 'Case not found in database' },
        { status: 404 }
      )
    }

    // Load case files from DB with graceful fallback
    let dbFiles: any[] = []
    try {
      dbFiles = await listCaseFiles(caseId)
    } catch (error: any) {
      // Log the error for debugging
      console.error('[list-assets] Error loading case files:', {
        caseId,
        errorCode: error.code,
        errorMessage: error.message,
      })
      // If model missing, table missing, or query fails, return empty list instead of 500
      console.warn('[list-assets] Failed to load case files:', error.message)
      if (
        error.code === 'PRISMA_MODEL_MISSING' || 
        error.code === 'P2021' || // Table does not exist
        error.message?.includes('caseFile') ||
        error.message?.includes('Table does not exist') ||
        error.message?.includes('case_files')
      ) {
        const isTableMissing = error.code === 'P2021' || error.message?.includes('Table does not exist')
        console.warn(`[list-assets] ${isTableMissing ? 'case_files table missing' : 'Prisma caseFile model missing'} - returning empty asset list`)
        return NextResponse.json({
          caseId,
          caseTitle: dbCase.title || 'Untitled Case',
          assets: [],
          totalAssets: 0,
          existingAssets: 0,
          warning: isTableMissing 
            ? 'case_files table does not exist. Please run: npx prisma db push or npx prisma migrate dev'
            : 'Case file model not available. Please run: npx prisma generate',
          caseContent: {
            description: dbCase.description || '',
            stages: [],
            rubric: dbCase.rubric || {},
            competencies: (dbCase.metadata as any)?.competencies || [],
            estimatedDuration: dbCase.estimatedMinutes || null,
            difficulty: dbCase.difficulty || null,
            hasStages: false,
            hasRubric: !!dbCase.rubric && Object.keys(dbCase.rubric).length > 0,
          }
        })
      }
      // Re-throw other errors
      throw error
    }

    // Map DB files to asset format with preview
    const assets = dbFiles.map((file) => {
      const exists = file.content !== null
      const isTruncated = file.content && file.content.length > 2000
      const preview = file.content 
        ? (isTruncated
            ? file.content.substring(0, 2000) + '\n\n... (truncated)' 
            : file.content)
        : null

      return {
        fileId: file.fileId,
        fileName: file.fileName,
        fileType: file.fileType,
        sourceType: file.content ? 'STATIC' : 'REFERENCE',
        exists,
        filePath: null, // No longer using file paths
        fileSize: file.size || (file.content ? file.content.length : null),
        lastGeneratedAt: file.updatedAt.toISOString(),
        canRegenerate: true,
        preview,
        mimeType: file.mimeType || null,
        truncated: isTruncated || false,
        previewReason: isTruncated ? 'Content exceeds 2000 character preview limit' : undefined,
      }
    })

    // Parse rubric from JSON if needed
    let rubric = dbCase.rubric
    if (typeof rubric === 'string') {
      try {
        rubric = JSON.parse(rubric)
      } catch {
        rubric = {}
      }
    }

    // Parse metadata for competencies
    const metadata = (dbCase.metadata as any) || {}
    const competencies = metadata.competencies || []

    const duration = Date.now() - startTime
    const existingCount = assets.filter((a: any) => a.exists).length
    console.info(`[list-assets:${requestId}] SUCCESS`, {
      duration: `${duration}ms`,
      caseId,
      totalAssets: assets.length,
      existingAssets: existingCount,
    })

    return NextResponse.json({
      caseId,
      caseTitle: dbCase.title || 'Untitled Case',
      assets,
      totalAssets: assets.length,
      existingAssets: existingCount,
      // Include core case content from DB
      caseContent: {
        description: dbCase.description || '',
        stages: [], // Stages are not stored in DB currently, would need to parse from briefingDoc if needed
        rubric,
        competencies,
        estimatedDuration: dbCase.estimatedMinutes || null,
        difficulty: dbCase.difficulty || null,
        hasStages: false, // Would need to parse from briefingDoc
        hasRubric: !!rubric && Object.keys(rubric).length > 0,
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[list-assets:${requestId}] ERROR after ${duration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to list assets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

