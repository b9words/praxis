import { NextRequest, NextResponse } from 'next/server'
import { getCaseById, getCaseFile } from '@/lib/db/cases'
import { validateCaseId } from '@/lib/case-id'

export const runtime = 'nodejs'

/**
 * GET /api/case-generation/get-asset
 * Get full content of a case file asset from DB
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `get-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { searchParams } = new URL(request.url)
    const caseIdParam = searchParams.get('caseId')
    const fileId = searchParams.get('fileId')
    
    console.info(`[get-asset:${requestId}] START`, { caseId: caseIdParam, fileId })

    // Validate caseId
    const caseIdValidation = validateCaseId(caseIdParam)
    if (!caseIdValidation.valid) {
      console.error(`[get-asset:${requestId}] Invalid caseId:`, caseIdValidation.error)
      return NextResponse.json(
        { error: caseIdValidation.error || 'Invalid or missing caseId query parameter' },
        { status: 400 }
      )
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing required: fileId query parameter' },
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

    // Get file from DB
    const file = await getCaseFile(caseId, fileId)
    if (!file) {
      return NextResponse.json(
        { error: 'File not found in database' },
        { status: 404 }
      )
    }

    if (!file.content) {
      console.warn(`[get-asset:${requestId}] File content is empty`)
      return NextResponse.json(
        { error: 'File content is empty', details: 'The file exists but has no content' },
        { status: 404 }
      )
    }

    const duration = Date.now() - startTime
    console.info(`[get-asset:${requestId}] SUCCESS`, {
      duration: `${duration}ms`,
      fileId,
      contentLength: file.content.length,
      mimeType: file.mimeType,
    })

    // Return content with appropriate content-type header
    return new NextResponse(file.content, {
      headers: {
        'Content-Type': file.mimeType || 'text/plain',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[get-asset:${requestId}] ERROR after ${duration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

