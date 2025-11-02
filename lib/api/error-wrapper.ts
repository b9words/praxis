/**
 * API Route Error Wrapper
 * Provides a consistent error handling wrapper for all API routes
 * Ensures ALL errors are properly handled with correct status codes and Sentry logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { normalizeError } from './route-helpers'
import { getPrismaErrorStatusCode } from '@/lib/prisma-error-handler'

export type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>

export interface StandardApiError {
  error: string | {
    code: string
    message: string
    details?: any
  }
}

/**
 * Standard API error response format
 */
export function createErrorResponse(
  error: any,
  options?: {
    defaultMessage?: string
    statusCode?: number
    includeDetails?: boolean
  }
): NextResponse<StandardApiError> {
  const { defaultMessage, statusCode, includeDetails } = options || {}

  // Handle auth errors separately
  if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Unauthorized' ? 401 : 403 }
    )
  }

  // Handle not found errors
  if (error?.code === 'P2025' || (error instanceof Error && error.message.includes('not found'))) {
    return NextResponse.json(
      { error: defaultMessage || 'Resource not found' },
      { status: 404 }
    )
  }

  // Normalize error
  const normalized = normalizeError(error)
  const finalStatusCode = statusCode || getPrismaErrorStatusCode(error)

  // Log to Sentry
  try {
    const { captureException } = require('@/lib/monitoring')
    captureException(error instanceof Error ? error : new Error(String(error)), {
      code: normalized.code,
      message: normalized.message,
      statusCode: finalStatusCode,
    })
  } catch (sentryError) {
    // Sentry not available - continue
  }

  // Return standardized error format
  const errorResponse: StandardApiError = {
    error: includeDetails
      ? {
          code: normalized.code,
          message: normalized.message,
          details: error?.details || undefined,
        }
      : normalized.message || defaultMessage || 'An error occurred',
  }

  return NextResponse.json(errorResponse, { status: finalStatusCode })
}

/**
 * Wraps an API route handler with comprehensive error handling
 * Automatically catches and normalizes all errors with Sentry logging
 */
export function withPrismaErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context)
    } catch (error: any) {
      return createErrorResponse(error)
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

