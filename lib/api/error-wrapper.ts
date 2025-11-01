/**
 * API Route Error Wrapper
 * Provides a consistent error handling wrapper for all API routes
 * Ensures ALL Prisma errors are properly handled with correct status codes
 */

import { NextRequest, NextResponse } from 'next/server'
import { normalizeError } from './route-helpers'
import { getPrismaErrorStatusCode } from '@/lib/prisma-error-handler'

export type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>

/**
 * Wraps an API route handler with comprehensive Prisma error handling
 * Automatically catches and normalizes all Prisma errors
 */
export function withPrismaErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error: any) {
      // Handle auth errors separately
      if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Unauthorized' ? 401 : 403 }
        )
      }
      
      // Use comprehensive Prisma error handling
      const normalized = normalizeError(error)
      const statusCode = getPrismaErrorStatusCode(error)
      
      // Log error for debugging
      console.error('[API Error]', normalized.code, normalized.message, error)
      
      return NextResponse.json({ error: normalized }, { status: statusCode })
    }
  }
}

/**
 * Helper to handle P2025 (record not found) errors gracefully
 */
export function handleRecordNotFound(error: any, resourceName: string): NextResponse | null {
  if (error?.code === 'P2025') {
    return NextResponse.json(
      { error: `${resourceName} not found` },
      { status: 404 }
    )
  }
  return null
}

