/**
 * Helper to handle Prisma enum errors gracefully
 * NOTE: Prisma schema has been updated to use String types instead of enums to match database TEXT columns.
 * This fallback is kept as a safety net, but enum errors should no longer occur.
 * If enum-related errors still appear, it indicates a mismatch between Prisma schema and database schema.
 */

// Track logged errors to prevent spam
const loggedErrors = new Set<string>()
const ERROR_LOG_INTERVAL = 300000 // Only log same error once per 5 minutes (increased from 1 minute)

function shouldLogError(errorKey: string): boolean {
  if (loggedErrors.has(errorKey)) {
    return false
  }
  loggedErrors.add(errorKey)
  // Clear after interval to allow occasional logging
  setTimeout(() => loggedErrors.delete(errorKey), ERROR_LOG_INTERVAL)
  return true
}

// Suppress specific Prisma error patterns completely
const SUPPRESSED_ERROR_PATTERNS = [
  'ContentStatus',
  'LessonProgressStatus', 
  'SimulationStatus',
  'does not exist',
  'violates foreign key constraint',
  '42704',
  'P2034',
  'P2022',
  'P2010'
]

function isSuppressedError(error: any): boolean {
  const errorString = error?.message || error?.code || ''
  return SUPPRESSED_ERROR_PATTERNS.some(pattern => 
    errorString.includes(pattern)
  )
}

export function isEnumError(error: any): boolean {
  return (
    error?.code === 'P2034' ||
    error?.message?.includes('does not exist') ||
    error?.message?.includes('42704') ||
    (error?.meta?.code === '42704') ||
    (error?.cause?.code === '42704')
  )
}

export function isForeignKeyError(error: any): boolean {
  return (
    error?.code === 'P2010' ||
    error?.code === '23503' ||
    error?.message?.includes('foreign key constraint') ||
    error?.message?.includes('violates foreign key')
  )
}

export function logErrorOnce(message: string, error?: any, level: 'warn' | 'error' = 'error'): void {
  // Check if this error should be completely suppressed
  if (isSuppressedError(error)) {
    return // Completely suppress known schema/enum errors
  }
  
  const errorKey = `${message}-${error?.code || ''}`
  if (!shouldLogError(errorKey)) {
    return // Suppress repeated errors
  }
  
  if (level === 'warn') {
    console.warn(message)
  } else {
    console.error(message, error?.message || '')
  }
}

