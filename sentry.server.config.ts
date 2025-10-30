/**
 * Sentry server-side configuration
 * This file is automatically used by @sentry/nextjs
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Filter server-side errors
  beforeSend(event, hint) {
    // Filter out health check errors
    if (event.request?.url?.includes('/api/health')) {
      return null
    }
    
    return event
  },
})

