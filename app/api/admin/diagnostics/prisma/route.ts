import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/server'

export const runtime = 'nodejs'

/**
 * GET /api/admin/diagnostics/prisma
 * Health check endpoint for Prisma client and models
 */
export async function GET(request: NextRequest) {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      clientVersion: '5.22.0', // Prisma version from package.json
      models: {},
      database: {
        reachable: false,
        error: null,
      },
    }

    // Check model presence
    const models = ['caseFile', 'case', 'competency', 'profile', 'article']
    for (const modelName of models) {
      try {
        const model = (prisma as any)[modelName]
        diagnostics.models[modelName] = {
          present: typeof model !== 'undefined',
          hasMethods: model ? typeof model.findMany === 'function' : false,
        }
      } catch (err) {
        diagnostics.models[modelName] = {
          present: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    }

    // Test database reachability with case_files table
    try {
      // Check if caseFile model exists first
      if (prisma.caseFile) {
        const caseFilesCount = await prisma.caseFile.count()
        diagnostics.database.reachable = true
        diagnostics.database.caseFilesCount = caseFilesCount
      } else {
        diagnostics.database.reachable = false
        diagnostics.database.error = 'caseFile model not available in Prisma client'
        diagnostics.database.code = 'PRISMA_MODEL_MISSING'
      }
    } catch (dbError: any) {
      diagnostics.database.reachable = false
      diagnostics.database.error = dbError.message || 'Unknown database error'
      diagnostics.database.code = dbError.code
    }

    // Overall health status
    const caseFilePresent = diagnostics.models.caseFile?.present === true
    const dbReachable = diagnostics.database.reachable === true
    const isHealthy = caseFilePresent && dbReachable

    return NextResponse.json({
      healthy: isHealthy,
      ...diagnostics,
      recommendations: !isHealthy
        ? [
            caseFilePresent
              ? null
              : 'Run: npx prisma generate',
            dbReachable
              ? null
              : 'Check database connection and run migrations',
          ].filter(Boolean)
        : [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

