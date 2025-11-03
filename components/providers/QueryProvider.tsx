'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

// Smart retry function: retry on network errors and 5xx, but not on 4xx (except 429)
function shouldRetry(failureCount: number, error: any): boolean {
  // Don't retry more than 3 times
  if (failureCount >= 3) return false
  
  // Check if error is a network error
  if (error?.message) {
    const message = error.message.toLowerCase()
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('etimedout') ||
      message.includes('failed to fetch')
    ) {
      return true
    }
  }
  
  // Check HTTP status code
  const status = error?.status || error?.statusCode || error?.response?.status
  if (status) {
    // Retry on server errors (5xx) and rate limits (429)
    if (status >= 500 || status === 429) {
      return true
    }
    // Don't retry on client errors (4xx except 429)
    if (status >= 400 && status < 500) {
      return false
    }
  }
  
  // Default: retry on unknown errors (fail-safe for network issues)
  return true
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: shouldRetry,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s (max 30s)
          },
          mutations: {
            retry: (failureCount, error) => {
              // Mutations: only retry on network errors, max 2 times
              if (failureCount >= 2) return false
              
              // Check if error is a network error
              if (error?.message) {
                const message = error.message.toLowerCase()
                return (
                  message.includes('network') ||
                  message.includes('timeout') ||
                  message.includes('econnrefused') ||
                  message.includes('etimedout') ||
                  message.includes('failed to fetch')
                )
              }
              
              // Retry on 429 (rate limit) and 5xx (server errors)
              const errorAny = error as any
              const status = errorAny?.status || errorAny?.statusCode || errorAny?.response?.status
              if (status) {
                return status >= 500 || status === 429
              }
              
              return false // Don't retry mutations on unknown errors
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s for mutations
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
