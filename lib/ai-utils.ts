/**
 * AI utility functions for retry logic and error handling
 * Used by Supabase Edge Functions for Gemini API calls
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableStatusCodes?: number[]
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryableStatusCodes'>> & { retryableStatusCodes: number[] } = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504], // Rate limit and server errors
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry (should throw on failure)
 * @param options - Retry configuration
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error, config.retryableStatusCodes)
      
      if (attempt === config.maxRetries || !isRetryable) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      )

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay
      const totalDelay = delay + jitter

      console.log(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${Math.round(totalDelay)}ms`,
        error
      )

      await sleep(totalDelay)
    }
  }

  throw lastError || new Error('Retry exhausted')
}

/**
 * Check if an error is retryable based on status code
 */
function isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
  // Check for HTTP status codes
  if (error && typeof error === 'object') {
    const statusCode = (error as any).status || (error as any).statusCode || (error as any).code
    
    if (typeof statusCode === 'number') {
      return retryableStatusCodes.includes(statusCode)
    }
    
    // Check error message for rate limit indicators
    const message = String((error as any).message || '')
    if (message.includes('rate limit') || message.includes('429')) {
      return true
    }
  }
  
  // Network errors and timeouts are retryable
  const errorMessage = error instanceof Error ? error.message : String(error)
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ETIMEDOUT')
  ) {
    return true
  }

  // Client errors (4xx except 429) are not retryable
  if (errorMessage.includes('400') || errorMessage.includes('401') || errorMessage.includes('403')) {
    return false
  }

  // Default to retryable for unknown errors (fail-safe)
  return true
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wrapper for fetch calls with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
        ;(error as any).status = response.status
        ;(error as any).statusCode = response.status
        throw error
      }
      
      return response
    },
    retryOptions
  )
}

