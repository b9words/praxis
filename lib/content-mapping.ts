/**
 * Content Mapping System
 * 
 * This module provides the mapping between legacy content routes and the unified curriculum structure.
 * All content (articles, lessons, cases) should be accessible through curriculum paths.
 */

import { getAllLessonsFlat } from './curriculum-data'

// Legacy content types that need to be mapped to curriculum
export type LegacyContentType = 'article' | 'content' | 'case-study'

export interface ContentMapping {
  legacyId: string
  legacyType: LegacyContentType
  curriculumPath: {
    domain: string
    module: string
    lesson: string
  }
  title: string
}

/**
 * Maps legacy article IDs to curriculum paths
 * This is a temporary mapping system during the transition
 */
const articleToCurriculumMapping: Record<string, { domain: string; module: string; lesson: string }> = {
  // Year 1 Financial Acumen articles
  'reading-financial-statements': { domain: 'second-order-decision-making', module: 'financial-statement-analysis', lesson: 'reading-balance-sheets' },
  'core-financial-metrics': { domain: 'second-order-decision-making', module: 'financial-statement-analysis', lesson: 'income-statement-mastery' },
  'unit-economics-cac-ltv': { domain: 'second-order-decision-making', module: 'unit-economics-mastery', lesson: 'cac-ltv-fundamentals' },
  'opex-vs-capex': { domain: 'second-order-decision-making', module: 'financial-statement-analysis', lesson: 'cash-flow-analysis' },
  'working-capital': { domain: 'second-order-decision-making', module: 'financial-statement-analysis', lesson: 'working-capital-optimization' },
  
  // Operations articles
  'lean-agile-operations': { domain: 'organizational-design-talent-density', module: 'operational-excellence', lesson: 'lean-methodology' },
  'okrs-team-structure': { domain: 'organizational-design-talent-density', module: 'goal-alignment-systems', lesson: 'okr-implementation' },
  
  // GTM Strategy articles  
  'competitive-positioning-strategy': { domain: 'competitive-moat-architecture', module: 'foundational-theory', lesson: 'competitive-analysis' },
  'unit-economics-mastery': { domain: 'second-order-decision-making', module: 'unit-economics-mastery', lesson: 'unit-economics-optimization' },
}

/**
 * Maps legacy content IDs to curriculum paths
 */
const contentToCurriculumMapping: Record<string, { domain: string; module: string; lesson: string }> = {
  // These would be populated based on existing content structure
  // For now, we'll map to appropriate curriculum lessons
}

/**
 * Maps legacy case study IDs to curriculum paths or simulation routes
 */
const caseStudyToCurriculumMapping: Record<string, { domain: string; module: string; lesson: string }> = {
  'unit-economics-crisis': { domain: 'second-order-decision-making', module: 'unit-economics-mastery', lesson: 'crisis-scenarios' },
  'market-positioning-dilemma': { domain: 'competitive-moat-architecture', module: 'foundational-theory', lesson: 'positioning-frameworks' },
  'supply-chain-crisis': { domain: 'crisis-leadership-public-composure', module: 'golden-hour-first-60-minutes', lesson: 'operational-crisis-response' },
  'toxic-top-performer': { domain: 'organizational-design-talent-density', module: 'talent-management', lesson: 'performance-management' },
}

/**
 * Get curriculum path for legacy content
 */
export function getCurriculumPathForLegacyContent(
  legacyId: string, 
  contentType: LegacyContentType
): { domain: string; module: string; lesson: string } | null {
  switch (contentType) {
    case 'article':
      return articleToCurriculumMapping[legacyId] || null
    case 'content':
      return contentToCurriculumMapping[legacyId] || null
    case 'case-study':
      return caseStudyToCurriculumMapping[legacyId] || null
    default:
      return null
  }
}

/**
 * Generate redirect URL for legacy content
 */
export function getRedirectUrlForLegacyContent(
  legacyId: string,
  contentType: LegacyContentType
): string | null {
  const curriculumPath = getCurriculumPathForLegacyContent(legacyId, contentType)
  
  if (!curriculumPath) {
    // If no mapping exists, redirect to main curriculum page
    return '/library/curriculum'
  }
  
  return `/library/curriculum/${curriculumPath.domain}/${curriculumPath.module}/${curriculumPath.lesson}`
}

/**
 * Check if a legacy content ID has a curriculum mapping
 */
export function hasLegacyContentMapping(legacyId: string, contentType: LegacyContentType): boolean {
  return getCurriculumPathForLegacyContent(legacyId, contentType) !== null
}

/**
 * Get all available curriculum paths for navigation
 */
export function getAllCurriculumPaths(): Array<{
  domain: string
  module: string  
  lesson: string
  url: string
  title: string
}> {
  const allLessons = getAllLessonsFlat()
  
  return allLessons.map(lesson => ({
    domain: lesson.domain,
    module: lesson.moduleId,
    lesson: lesson.lessonId,
    url: `/library/curriculum/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`,
    title: lesson.lessonTitle
  }))
}

/**
 * Smart content recommendation based on curriculum structure
 * This replaces the old recommendation system with curriculum-aware suggestions
 */
export function getSmartCurriculumRecommendation(
  userProgress?: any,
  currentPath?: { domain: string; module: string; lesson: string }
): { domain: string; module: string; lesson: string; url: string; title: string; reason: string } | null {
  const allLessons = getAllLessonsFlat()
  
  // If no progress, recommend first lesson
  if (!userProgress || !currentPath) {
    const firstLesson = allLessons[0]
    return {
      domain: firstLesson.domain,
      module: firstLesson.moduleId,
      lesson: firstLesson.lessonId,
      url: `/library/curriculum/${firstLesson.domain}/${firstLesson.moduleId}/${firstLesson.lessonId}`,
      title: firstLesson.lessonTitle,
      reason: 'Start your learning journey with foundational concepts'
    }
  }
  
  // Find current lesson index and recommend next
  const currentIndex = allLessons.findIndex(
    l => l.domain === currentPath.domain && 
         l.moduleId === currentPath.module && 
         l.lessonId === currentPath.lesson
  )
  
  if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
    const nextLesson = allLessons[currentIndex + 1]
    return {
      domain: nextLesson.domain,
      module: nextLesson.moduleId,
      lesson: nextLesson.lessonId,
      url: `/library/curriculum/${nextLesson.domain}/${nextLesson.moduleId}/${nextLesson.lessonId}`,
      title: nextLesson.lessonTitle,
      reason: 'Continue your structured learning path'
    }
  }
  
  return null
}
