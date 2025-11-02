/**
 * Sentry client-side configuration
 * This file is automatically used by @sentry/nextjs
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking for build correlation
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
  dist: process.env.VERCEL_DEPLOYMENT_ID || undefined,
  
  // Balanced privacy: Don't send PII by default
  sendDefaultPii: false,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set profilesSampleRate to profile a percentage of transactions
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Balanced privacy: Lower session replay rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Filter out common non-actionable errors and scrub PII
  beforeSend(event, hint) {
    // Don't send errors from extensions
    if (event.request?.url) {
      const url = event.request.url
      if (
        url.includes('chrome-extension://') ||
        url.includes('moz-extension://') ||
        url.includes('safari-extension://')
      ) {
        return null
      }
      
      // Scrub sensitive data from URLs (e.g., tokens, IDs)
      try {
        const urlObj = new URL(url)
        // Remove sensitive query params
        const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key', 'auth']
        sensitiveParams.forEach(param => {
          if (urlObj.searchParams.has(param)) {
            urlObj.searchParams.set(param, '[REDACTED]')
          }
        })
        event.request.url = urlObj.toString()
      } catch {
        // Invalid URL, skip scrubbing
      }
    }
    
    // Filter out known non-critical errors
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value || ''
      if (
        errorMessage.includes('ResizeObserver loop limit exceeded') ||
        errorMessage.includes('Non-Error promise rejection captured')
      ) {
        return null
      }
    }
    
    // Scrub sensitive headers
    if (event.request?.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']
      sensitiveHeaders.forEach(header => {
        const key = Object.keys(event.request.headers).find(
          k => k.toLowerCase() === header.toLowerCase()
        )
        if (key) {
          event.request.headers[key] = '[REDACTED]'
        }
      })
    }
    
    return event
  },
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Balanced privacy: Mask text content in replays
      maskAllText: process.env.NODE_ENV === 'production',
      blockAllMedia: false,
    }),
  ],
})

