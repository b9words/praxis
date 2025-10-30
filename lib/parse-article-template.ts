/**
 * Parses article content following Content Ops template structure
 * Expected sections:
 * ### Core Principle
 * ### The Framework / Model
 * ### Common Pitfalls
 * ### Application Example
 */

export interface ArticleSection {
  type: 'core_principle' | 'framework' | 'pitfalls' | 'application' | 'unknown'
  title: string
  content: string
}

export interface ParsedArticle {
  sections: ArticleSection[]
  isValid: boolean
  missingSections?: string[]
}

const REQUIRED_SECTIONS = [
  { type: 'core_principle' as const, pattern: /^###\s+(core principle|the core principle)/i },
  { type: 'framework' as const, pattern: /^###\s+(the framework|framework|the model|model)/i },
  { type: 'pitfalls' as const, pattern: /^###\s+(common pitfalls|pitfalls)/i },
  { type: 'application' as const, pattern: /^###\s+(application example|application|example)/i },
]

export function parseArticleTemplate(markdown: string): ParsedArticle {
  const sections: ArticleSection[] = []
  const foundSections = new Set<string>()
  
  // Split by h3 headings
  const h3Pattern = /^###\s+(.+)$/gm
  const matches = Array.from(markdown.matchAll(h3Pattern))
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const heading = match[1].trim()
    const startIndex = match.index! + match[0].length
    const endIndex = matches[i + 1]?.index || markdown.length
    const content = markdown.substring(startIndex, endIndex).trim()
    
    // Determine section type
    let sectionType: ArticleSection['type'] = 'unknown'
    for (const req of REQUIRED_SECTIONS) {
      if (req.pattern.test(`### ${heading}`)) {
        sectionType = req.type
        foundSections.add(req.type)
        break
      }
    }
    
    sections.push({
      type: sectionType,
      title: heading,
      content,
    })
  }
  
  // Check which sections are missing
  const missingSections: string[] = []
  for (const req of REQUIRED_SECTIONS) {
    if (!foundSections.has(req.type)) {
      missingSections.push(req.type.replace('_', ' '))
    }
  }
  
  return {
    sections,
    isValid: missingSections.length === 0,
    missingSections: missingSections.length > 0 ? missingSections : undefined,
  }
}

/**
 * Validates if article follows the template
 */
export function validateArticleTemplate(markdown: string): {
  valid: boolean
  missingSections?: string[]
  errors?: string[]
} {
  const parsed = parseArticleTemplate(markdown)
  const errors: string[] = []
  
  // Check for required sections
  if (!parsed.isValid && parsed.missingSections) {
    errors.push(`Missing required sections: ${parsed.missingSections.join(', ')}`)
  }
  
  // Check if sections have content
  for (const section of parsed.sections) {
    if (section.content.trim().length < 50) {
      errors.push(`Section "${section.title}" is too short (minimum 50 characters)`)
    }
  }
  
  return {
    valid: parsed.isValid && errors.length === 0,
    missingSections: parsed.missingSections,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Extract key takeaways from Core Principle section
 */
export function extractKeyTakeaways(corePrincipleContent: string): string[] {
  const takeaways: string[] = []
  
  // Look for bullet points
  const bulletPattern = /^[-*]\s+(.+)$/gm
  const matches = Array.from(corePrincipleContent.matchAll(bulletPattern))
  
  for (const match of matches) {
    takeaways.push(match[1].trim())
  }
  
  // If no bullets found, take first 2-3 sentences
  if (takeaways.length === 0) {
    const sentences = corePrincipleContent.split(/[.!?]+/).filter(s => s.trim().length > 20)
    takeaways.push(...sentences.slice(0, 3).map(s => s.trim()))
  }
  
  return takeaways
}

