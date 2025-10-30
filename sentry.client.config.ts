/**
 * Sentry client-side configuration
 * This file is automatically used by @sentry/nextjs
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set profilesSampleRate to profile a percentage of transactions
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Filter out common non-actionable errors
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
    
    return event
  },
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
})

