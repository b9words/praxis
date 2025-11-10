/**
 * Helper functions for building case study URLs
 * Centralizes route construction to avoid hardcoded paths
 */

/**
 * Get the URL for a case study overview page
 */
export function getCaseUrl(caseId: string): string {
  return `/library/case-studies/${caseId}`
}

/**
 * Get the URL for a case study tasks/workspace page
 */
export function getCaseTasksUrl(caseId: string): string {
  return `/library/case-studies/${caseId}/tasks`
}

/**
 * Get the URL for the case studies listing page
 */
export function getCaseStudiesUrl(): string {
  return '/library/case-studies'
}





