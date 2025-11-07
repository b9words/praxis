/**
 * Database utility functions for consistent Prisma access
 * All database operations should go through these helpers
 */

import { prisma } from '@/lib/prisma/server'
import { withConnectionRetry } from '@/lib/prisma/retry'
import { normalizePrismaError, getPrismaErrorStatusCode } from '@/lib/prisma-error-handler'
import type { Prisma } from '@prisma/client'

/**
 * Custom error class for database operations
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Wrapper for all database operations with retry and error normalization
 * Use this for all Prisma queries/mutations
 * 
 * Note: P2022 (Column does not exist) errors are thrown as AppError
 * Repository functions should handle these gracefully by catching and retrying
 * with explicit select statements
 */
/**
 * Ensure Prisma client has all required models
 * If caseFile model is missing, try to regenerate and reload
 */
function ensurePrismaModels(prismaClient: typeof prisma): typeof prisma {
  // Runtime check for caseFile model
  if (!prismaClient.caseFile) {
    console.warn('[dbCall] Prisma client missing caseFile model - attempting to reload...')
    try {
      // Try to re-import a fresh PrismaClient
      const { PrismaClient } = require('@prisma/client')
      const freshClient = new PrismaClient({
        errorFormat: 'minimal',
        log: [],
      })
      if (freshClient.caseFile) {
        console.log('[dbCall] Fresh Prisma client has caseFile model')
        return freshClient as typeof prisma
      }
    } catch (reloadError) {
      console.error('[dbCall] Failed to reload Prisma client:', reloadError)
    }
    throw new AppError(
      'Prisma client missing caseFile model. Please run: npx prisma generate',
      500,
      'PRISMA_MODEL_MISSING'
    )
  }
  return prismaClient
}

export async function dbCall<T>(
  fn: (p: typeof prisma) => Promise<T>
): Promise<T> {
  try {
    // Ensure prisma is available and has all models
    if (!prisma) {
      throw new Error('Prisma client not initialized')
    }
    
    // Ensure required models exist
    const verifiedPrisma = ensurePrismaModels(prisma)
    
    return await withConnectionRetry(() => fn(verifiedPrisma), {
      maxRetries: 3,
      retryDelay: 150,
      exponentialBackoff: true,
    })
  } catch (error: any) {
    const normalized = normalizePrismaError(error)
    throw new AppError(
      normalized.message,
      normalized.statusCode,
      normalized.code
    )
  }
}

/**
 * Transaction helper for multi-step database operations
 */
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  try {
    return await withConnectionRetry(
      () => prisma.$transaction(fn, { timeout: 10000 }),
      {
        maxRetries: 3,
        retryDelay: 150,
        exponentialBackoff: true,
      }
    )
  } catch (error: any) {
    const normalized = normalizePrismaError(error)
    throw new AppError(
      normalized.message,
      normalized.statusCode,
      normalized.code
    )
  }
}

/**
 * Assert that a record was found, throw 404 if null
 */
export function assertFound<T>(
  record: T | null,
  resourceName: string = 'Record'
): asserts record is T {
  if (!record) {
    throw new AppError(`${resourceName} not found`, 404, 'NOT_FOUND')
  }
}

/**
 * Check if error is a P2022 (Column does not exist) error
 * This is useful for handling missing columns gracefully
 */
export function isColumnNotFoundError(error: any): boolean {
  return (
    (error instanceof AppError && error.code === 'P2022') ||
    error.code === 'P2022'
  )
}

