import { NextRequest, NextResponse } from 'next/server'
import { getCaseById, listCaseFiles } from '@/lib/db/cases'
import { validateCaseId } from '@/lib/case-id'

export const runtime = 'nodejs'

/**
 * GET /api/case-generation/health
 * Health check endpoint for case generation system
 * Returns diagnostic information about DB connectivity and case state
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { searchParams } = new URL(request.url)
    const caseIdParam = searchParams.get('caseId')
    
    console.info(`[health:${requestId}] START`, { caseId: caseIdParam })

    const health: {
      prismaConnected: boolean
      caseExists: boolean | null
      caseFilesCount: number | null
      caseId?: string
      error?: string
    } = {
      prismaConnected: false,
      caseExists: null,
      caseFilesCount: null,
    }

    // Test Prisma connection by attempting a simple query
    try {
      // Try to query cases table (limit 1 to be fast)
      await getCaseById('test-connection-check')
      health.prismaConnected = true
    } catch (error: any) {
      // If it's a "not found" error, Prisma is connected but case doesn't exist (expected)
      if (error?.code === 'P2025' || error?.message?.includes('not found')) {
        health.prismaConnected = true
      } else if (error?.code === 'P2021' || error?.message?.includes('Table') || error?.message?.includes('does not exist')) {
        // Table doesn't exist
        health.prismaConnected = false
        health.error = 'Database table does not exist. Run migrations: npx prisma db push'
      } else {
        health.prismaConnected = false
        health.error = error?.message || 'Prisma connection failed'
      }
    }

    // If caseId provided, check case and files
    if (caseIdParam) {
      const validation = validateCaseId(caseIdParam)
      if (validation.valid && validation.caseId) {
        health.caseId = validation.caseId
        
        try {
          const dbCase = await getCaseById(validation.caseId)
          health.caseExists = !!dbCase
          
          if (dbCase) {
            try {
              const files = await listCaseFiles(validation.caseId)
              health.caseFilesCount = files.length
            } catch (fileError: any) {
              if (fileError?.code === 'P2021' || fileError?.message?.includes('Table') || fileError?.message?.includes('does not exist')) {
                health.error = 'case_files table does not exist. Run migrations: npx prisma db push'
              } else {
                health.error = `Failed to list files: ${fileError?.message || 'Unknown error'}`
              }
            }
          }
        } catch (error: any) {
          health.error = `Failed to check case: ${error?.message || 'Unknown error'}`
        }
      } else {
        health.error = validation.error || 'Invalid caseId format'
      }
    }

    const duration = Date.now() - startTime
    console.info(`[health:${requestId}] SUCCESS`, { duration: `${duration}ms`, ...health })

    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString(),
      requestId,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[health:${requestId}] ERROR after ${duration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        prismaConnected: false,
        caseExists: null,
        caseFilesCount: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 }
    )
  }
}


