import { NextRequest, NextResponse } from 'next/server';
import { getPrismaErrorInfo, normalizePrismaError, getPrismaErrorStatusCode } from '@/lib/prisma-error-handler';

/**
 * Check if error is a Prisma missing table error (P2021)
 * Alias: isPrismaMissingTable (matches plan naming)
 */
export function isMissingTable(error: any): boolean {
  return error?.code === 'P2021' || 
         (error?.message && error.message.includes('does not exist in the current database'))
}

/**
 * Check if error is a foreign key constraint error
 */
export function isForeignKeyError(error: any): boolean {
  const info = getPrismaErrorInfo(error)
  return info?.code === 'P2003' || 
         info?.code === 'P2010' ||
         info?.code === '23503' ||
         (error?.message && error.message.includes('foreign key constraint'))
}

/**
 * Normalize error to consistent format with comprehensive Prisma error handling
 */
export function normalizeError(error: any): { code: string; message: string } {
  const prismaInfo = getPrismaErrorInfo(error)
  
  if (prismaInfo) {
    return {
      code: prismaInfo.code,
      message: prismaInfo.message,
    }
  }
  
  // Legacy checks for backward compatibility
  if (isMissingTable(error)) {
    return { code: 'MISSING_TABLE', message: 'Database table not found' }
  }
  if (isForeignKeyError(error)) {
    return { code: 'FOREIGN_KEY_ERROR', message: 'Referenced record does not exist' }
  }
  if (error?.code === 'P2002') {
    return { code: 'UNIQUE_CONSTRAINT', message: 'Duplicate entry' }
  }
  
  // Fallback
  if (error instanceof Error) {
    return { code: 'INTERNAL_ERROR', message: error.message || 'An unknown error occurred' }
  }
  return { code: 'INTERNAL_ERROR', message: 'An unknown error occurred' }
}

/**
 * Alias for isMissingTable (matches plan naming)
 */
export const isPrismaMissingTable = isMissingTable

/**
 * Soft-fail wrapper for read endpoints
 * Note: Plan mentions "softAuth" but this is functionally equivalent
 * Returns default values instead of errors for common failure cases
 */
export function softRead<T>(
  defaults: T,
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error: any) {
      // Handle unauthorized - return defaults instead of 401
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json(defaults, { status: 200 })
      }
      
      // Handle profile not found - return defaults
      if (error instanceof Error && error.message.includes('Profile not found')) {
        return NextResponse.json(defaults, { status: 200 })
      }
      
      // Handle missing table - return defaults
      if (isMissingTable(error)) {
        return NextResponse.json(defaults, { status: 200 })
      }
      
      // For other errors, log but still return defaults to prevent crashes
      console.error('Error in soft-read handler:', error)
      return NextResponse.json(defaults, { status: 200 })
    }
  }
}

