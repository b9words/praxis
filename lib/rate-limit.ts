/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < fiveMinutesAgo) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds (default: 60000 = 1 minute)
  maxRequests?: number // Maximum requests per window (default: 60)
  keyGenerator?: (userId?: string, ip?: string) => string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a user/IP
 */
export function checkRateLimit(
  userId?: string,
  ip?: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 60, // 60 requests per minute default
    keyGenerator = (uid, ipAddr) => uid || `ip:${ipAddr || 'unknown'}`,
  } = options

  const key = keyGenerator(userId, ip)
  const now = Date.now()

  const entry = rateLimitStore.get(key)
  
  if (!entry || now >= entry.resetAt) {
    // New window or expired window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, newEntry)
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  // Within window
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get IP address from request
 */
export function getClientIp(request: Request): string {
  const headers = request.headers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

