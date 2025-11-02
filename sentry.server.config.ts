/**
 * Sentry server-side configuration
 * This file is automatically used by @sentry/nextjs
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking for build correlation
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
  dist: process.env.VERCEL_DEPLOYMENT_ID || undefined,
  
  // Balanced privacy: Don't send PII by default
  sendDefaultPii: false,
  
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Filter server-side errors and scrub PII
  beforeSend(event, hint) {
    // Filter out health check errors
    if (event.request?.url?.includes('/api/health')) {
      return null
    }
    
    // Scrub sensitive data from URLs
    if (event.request?.url) {
      try {
        const urlObj = new URL(event.request.url)
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
    
    // Scrub sensitive headers
    if (event.request?.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'x-service-role-key']
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
})

