/**
 * Safe Prisma wrapper utilities
 * Ensures ALL Prisma operations are wrapped with comprehensive error handling
 * Prevents ANY Prisma errors from bubbling up unhandled
 */

import { getPrismaErrorInfo, normalizePrismaError, getPrismaErrorStatusCode } from './prisma-error-handler'
import { isMissingTable } from './api/route-helpers'
import { prisma } from './prisma/server'

/**
 * Safe wrapper for any Prisma operation
 * Catches and normalizes all Prisma errors
 */
export async function safePrisma<T>(
  operation: () => Promise<T>,
  fallback?: T | (() => T | Promise<T>)
): Promise<{ data: T | null; error: ReturnType<typeof normalizePrismaError> | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error: any) {
    const normalized = normalizePrismaError(error)
    
    // Log error for debugging (but suppress P2021 - missing table errors since they're handled gracefully)
    if (process.env.NODE_ENV === 'development' && !isMissingTable(error)) {
      console.error('[Prisma Error]', normalized.code, normalized.message, error)
    }
    
    // Return fallback if provided
    if (fallback !== undefined) {
      const fallbackValue = typeof fallback === 'function' ? await fallback() : fallback
      return { data: fallbackValue, error: normalized }
    }
    
    return { data: null, error: normalized }
  }
}

/**
 * Safe findUnique with automatic error handling
 */
export async function safeFindUnique<T>(
  model: string,
  where: any,
  options?: any
): Promise<{ data: T | null; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    return await modelClient.findUnique({ where, ...options }) as T
  }, null)
}

/**
 * Safe findFirst with automatic error handling
 */
export async function safeFindFirst<T>(
  model: string,
  where: any,
  options?: any
): Promise<{ data: T | null; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    return await modelClient.findFirst({ where, ...options }) as T
  }, null)
}

/**
 * Safe findMany with automatic error handling
 */
export async function safeFindMany<T>(
  model: string,
  where: any,
  options?: any
): Promise<{ data: T[]; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    return await modelClient.findMany({ where, ...options }) as T[]
  }, [])
}

/**
 * Safe create with automatic error handling
 */
export async function safeCreate<T>(
  model: string,
  data: any,
  options?: any
): Promise<{ data: T | null; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    return await modelClient.create({ data, ...options }) as T
  }, null)
}

/**
 * Safe update with automatic error handling and existence check
 */
export async function safeUpdate<T>(
  model: string,
  where: any,
  data: any,
  options?: any
): Promise<{ data: T | null; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    
    // Check if record exists first (prevents P2025)
    const existing = await modelClient.findUnique({ where })
    if (!existing) {
      const error = new Error('Record not found') as any
      error.code = 'P2025'
      throw error
    }
    
    return await modelClient.update({ where, data, ...options }) as T
  }, null)
}

/**
 * Safe delete with automatic error handling and existence check
 */
export async function safeDelete<T>(
  model: string,
  where: any
): Promise<{ data: T | null; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    
    // Check if record exists first (prevents P2025)
    const existing = await modelClient.findUnique({ where })
    if (!existing) {
      const error = new Error('Record not found') as any
      error.code = 'P2025'
      throw error
    }
    
    return await modelClient.delete({ where }) as T
  }, null)
}

/**
 * Safe count with automatic error handling
 */
export async function safeCount(
  model: string,
  where?: any
): Promise<{ data: number; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    return await modelClient.count({ where }) as number
  }, 0)
}

/**
 * Safe upsert with automatic error handling
 */
export async function safeUpsert<T>(
  model: string,
  where: any,
  create: any,
  update: any,
  options?: any
): Promise<{ data: T | null; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    return await modelClient.upsert({ where, create, update, ...options }) as T
  }, null)
}

/**
 * Safe updateMany with automatic error handling
 */
export async function safeUpdateMany<T>(
  model: string,
  where: any,
  data: any
): Promise<{ data: { count: number }; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(async () => {
    const modelClient = (prisma as any)[model]
    if (!modelClient) {
      throw new Error(`Model ${model} does not exist in Prisma client`)
    }
    return await modelClient.updateMany({ where, data }) as { count: number }
  }, { count: 0 })
}

/**
 * Safe transaction with automatic error handling
 */
export async function safeTransaction<T>(
  callback: (tx: any) => Promise<T>,
  options?: any
): Promise<{ data: T | null; error: ReturnType<typeof normalizePrismaError> | null }> {
  return safePrisma(() => prisma.$transaction(callback, options), null)
}

