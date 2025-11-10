import { NextRequest, NextResponse } from 'next/server'
import { getCaseById, getCaseFile, upsertCaseFile } from '@/lib/db/cases'
import { validateCaseId } from '@/lib/case-id'
import { getMimeTypeForAsset } from '@/lib/asset-utils'

export const runtime = 'nodejs'

/**
 * POST /api/case-generation/update-asset
 * Update an existing case file asset
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const body = await request.json()
    const { caseId: caseIdParam, fileId, content } = body
    
    console.info(`[update-asset:${requestId}] START`, {
      caseId: caseIdParam,
      fileId,
      contentLength: typeof content === 'string' ? content.length : 'not-string',
    })

    // Validate caseId
    const caseIdValidation = validateCaseId(caseIdParam)
    if (!caseIdValidation.valid) {
      console.error(`[update-asset:${requestId}] Invalid caseId:`, caseIdValidation.error)
      return NextResponse.json(
        { error: caseIdValidation.error || 'Invalid or missing caseId' },
        { status: 400 }
      )
    }

    if (!fileId || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required: fileId and content' },
        { status: 400 }
      )
    }

    const caseId = caseIdValidation.caseId!

    // Verify case exists
    const dbCase = await getCaseById(caseId)
    if (!dbCase) {
      return NextResponse.json(
        { error: 'Case not found in database' },
        { status: 404 }
      )
    }

    // Get existing file or create new one
    let existingFile = await getCaseFile(caseId, fileId)
    if (!existingFile) {
      return NextResponse.json(
        { error: `File ${fileId} not found in case` },
        { status: 404 }
      )
    }

    // Validate content format based on file type
    const fileType = existingFile.fileType || ''
    const isCSV = fileType === 'FINANCIAL_DATA' || existingFile.fileName?.endsWith('.csv')
    const isJSON = fileType === 'ORG_CHART' || fileType === 'STAKEHOLDER_PROFILES' || fileType === 'MARKET_DATASET' || existingFile.fileName?.endsWith('.json')

    if (isJSON) {
      try {
        JSON.parse(content)
      } catch (e) {
        return NextResponse.json(
          { 
            error: 'Invalid JSON content',
            details: e instanceof Error ? e.message : 'JSON parse error',
          },
          { status: 400 }
        )
      }
    }

    // For CSV, basic validation - check if it has at least one row
    if (isCSV) {
      const lines = content.trim().split('\n').filter((line: string) => line.trim())
      if (lines.length === 0) {
        return NextResponse.json(
          { error: 'CSV content must have at least one row' },
          { status: 400 }
        )
      }
    }

    // Determine mime type using centralized helper
    const mimeType = getMimeTypeForAsset(fileType)

    // Update file in DB
    const updatedFile = await upsertCaseFile({
      caseId,
      fileId,
      fileName: existingFile.fileName,
      fileType: existingFile.fileType,
      mimeType,
      content,
      size: content.length,
    })

    const duration = Date.now() - startTime
    console.info(`[update-asset:${requestId}] SUCCESS`, {
      duration: `${duration}ms`,
      fileId: updatedFile.fileId,
      size: updatedFile.size,
    })

    return NextResponse.json({
      success: true,
      fileId: updatedFile.fileId,
      fileName: updatedFile.fileName,
      fileType: updatedFile.fileType,
      mimeType: updatedFile.mimeType,
      fileSize: updatedFile.size,
      lastUpdatedAt: updatedFile.updatedAt.toISOString(),
      preview: content.length > 2000 ? content.substring(0, 2000) + '\n\n... (truncated)' : content,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[update-asset:${requestId}] ERROR after ${duration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to update asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

