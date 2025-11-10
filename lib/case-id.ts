/**
 * Case ID normalization and validation utilities
 */

/**
 * UUID v4 regex pattern
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Normalize a case ID value to a string or null
 * Handles objects, strings, null, undefined, and common mistakes like "[object Object]"
 */
export function normalizeCaseId(value: any): string | null {
  if (!value) return null
  
  if (typeof value === 'string') {
    const trimmed = value.trim()
    // Reject obvious object-to-string accidents
    if (trimmed === '[object Object]' || trimmed === 'object Object' || trimmed === '[object Object]') {
      return null
    }
    return trimmed || null
  }
  
  if (typeof value === 'object') {
    // If it's an object with an id property, use that
    if ('id' in value && typeof value.id === 'string') {
      return value.id.trim() || null
    }
    // Otherwise, reject it
    return null
  }
  
  // Try to convert to string as last resort
  const str = String(value).trim()
  if (str === '[object Object]' || str === 'object Object' || !str) {
    return null
  }
  return str
}

/**
 * Check if a case ID looks plausible (UUID v4 format)
 * This is a heuristic - not all valid case IDs are UUIDs
 */
export function isPlausibleCaseId(caseId: string | null): boolean {
  if (!caseId) return false
  // Check for UUID v4 format
  if (UUID_V4_REGEX.test(caseId)) {
    return true
  }
  // Also allow non-UUID formats that are at least 3 characters and don't look like object strings
  if (caseId.length >= 3 && !caseId.includes('[object')) {
    return true
  }
  return false
}

/**
 * Validate and normalize a case ID, returning an error message if invalid
 */
export function validateCaseId(value: any): { valid: boolean; caseId: string | null; error?: string } {
  const normalized = normalizeCaseId(value)
  
  if (!normalized) {
    return {
      valid: false,
      caseId: null,
      error: 'Invalid case ID: value is null, undefined, or "[object Object]"'
    }
  }
  
  if (!isPlausibleCaseId(normalized)) {
    return {
      valid: false,
      caseId: normalized,
      error: `Invalid case ID format: "${normalized}"`
    }
  }
  
  return {
    valid: true,
    caseId: normalized
  }
}






