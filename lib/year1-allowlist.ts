import * as fs from 'fs'
import * as path from 'path'

export interface Year1Allowlist {
  articleSlugs: string[]
  lessonSlugs: string[]
  caseStudySlugs: string[]
}

let cachedAllowlist: Year1Allowlist | null = null

/**
 * Load Year 1 allowlist from JSON file
 */
export function getYear1Allowlist(): Year1Allowlist {
  if (cachedAllowlist) {
    return cachedAllowlist
  }

  const allowlistPath = path.join(process.cwd(), 'content', 'year1-slugs.json')
  
  if (!fs.existsSync(allowlistPath)) {
    // If allowlist doesn't exist, return empty (no filtering)
    console.warn('Year 1 allowlist not found at', allowlistPath, '- no content filtering applied')
    return {
      articleSlugs: [],
      lessonSlugs: [],
      caseStudySlugs: []
    }
  }

  try {
    const content = fs.readFileSync(allowlistPath, 'utf8')
    cachedAllowlist = JSON.parse(content) as Year1Allowlist
    return cachedAllowlist
  } catch (error) {
    console.error('Error loading Year 1 allowlist:', error)
    return {
      articleSlugs: [],
      lessonSlugs: [],
      caseStudySlugs: []
    }
  }
}

/**
 * Check if an article ID is in Year 1 allowlist
 */
export function isYear1Article(articleId: string): boolean {
  const allowlist = getYear1Allowlist()
  return allowlist.articleSlugs.includes(articleId)
}

/**
 * Check if a lesson path is in Year 1 allowlist
 * Format: domain/module/lesson
 */
export function isYear1Lesson(domain: string, module: string, lesson: string): boolean {
  const allowlist = getYear1Allowlist()
  const lessonPath = `${domain}/${module}/${lesson}`
  return allowlist.lessonSlugs.includes(lessonPath)
}

/**
 * Check if a case study ID is in Year 1 allowlist
 */
export function isYear1CaseStudy(caseId: string): boolean {
  const allowlist = getYear1Allowlist()
  return allowlist.caseStudySlugs.includes(caseId)
}





