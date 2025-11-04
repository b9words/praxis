/**
 * Retry wrapper for Prisma queries with connection error handling
 * Automatically retries recoverable connection errors
 * 
 * Server-only: Cannot be used in client components or edge runtime
 */

import { isRecoverablePrismaError } from '../prisma-error-handler'

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  exponentialBackoff?: boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true,
}

/**
 * Retry a Prisma query with automatic retry on recoverable connection errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, retryDelay, exponentialBackoff } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  let lastError: any
  let delay = retryDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Check if this is a recoverable connection error
      if (!isRecoverablePrismaError(error)) {
        // Not recoverable, throw immediately
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 100 // 0-100ms random jitter
      await new Promise((resolve) => setTimeout(resolve, delay + jitter))

      // Exponential backoff: double the delay for next retry
      if (exponentialBackoff) {
        delay *= 2
      }
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError
}

/**
 * Retry a Prisma query with a connection health check first
 */
export async function withConnectionRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { prisma } = await import('./server')

  // Check connection health first
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error: any) {
    // Connection is down, try to reconnect
    if (isRecoverablePrismaError(error)) {
      try {
        await prisma.$connect()
      } catch (connectError) {
        // Connection failed, will retry in withRetry
      }
    }
  }

  // Execute with retry
  return withRetry(fn, options)
}

