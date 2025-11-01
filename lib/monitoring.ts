/**
 * Monitoring and error tracking helpers
 * Sentry initialization is handled in sentry.client.config.ts and sentry.server.config.ts
 * This file only provides helper functions for manual error tracking
 */

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    // Client-side
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error, {
        extra: context,
      })
    }).catch(() => {
      // Sentry not available, just log
      console.error('Error:', error, context)
    })
  } else {
    // Server-side
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error, {
        extra: context,
      })
    }).catch(() => {
      // Sentry not available, just log
      console.error('Error:', error, context)
    })
  }
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureMessage(message, {
        level,
        extra: context,
      })
    }).catch(() => {
      console.log(`[${level.toUpperCase()}]`, message, context)
    })
  } else {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureMessage(message, {
        level,
        extra: context,
      })
    }).catch(() => {
      console.log(`[${level.toUpperCase()}]`, message, context)
    })
  }
}

/**
 * Add user context to Sentry
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      })
    }).catch(() => {
      // Sentry not available
    })
  } else {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      })
    }).catch(() => {
      // Sentry not available
    })
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      })
    }).catch(() => {
      // Sentry not available
    })
  } else {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      })
    }).catch(() => {
      // Sentry not available
    })
  }
}

/**
 * Log once per key to prevent spam
 * Uses in-memory map (server-side) or sessionStorage (client-side)
 */
const loggedKeys = new Set<string>()

export function logOnce(key: string, level: 'warn' | 'error', message: string, data?: any): void {
  if (loggedKeys.has(key)) {
    return
  }

  loggedKeys.add(key)
  
  if (level === 'error') {
    console.error(`[${key}]`, message, data || '')
    captureMessage(message, 'error', { key, ...data })
  } else {
    console.warn(`[${key}]`, message, data || '')
    captureMessage(message, 'warning', { key, ...data })
  }
}
