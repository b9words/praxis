import { loadLessonByPath } from './content-loader'
import { completeCurriculumData } from './curriculum-data'
import { isYear1Lesson } from './year1-allowlist'

export interface LessonSearchResult {
  domainId: string
  domainTitle: string
  moduleId: string
  moduleTitle: string
  lessonId: string
  lessonTitle: string
  lessonDescription: string
  matchInContent: boolean
  matchInTitle: boolean
  matchInDescription: boolean
  snippet?: string // Extract relevant snippet around match
}

/**
 * Search through lesson content, titles, and descriptions
 * This loads actual markdown content to search within
 */
export async function searchLessons(query: string): Promise<LessonSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  const results: LessonSearchResult[] = []

  // Search through all curriculum lessons (Year 1 only)
  for (const domain of completeCurriculumData) {
    for (const module of domain.modules) {
      for (const lesson of module.lessons) {
        // Filter to Year 1 content only
        if (!isYear1Lesson(domain.id, module.id, lesson.id)) {
          continue
        }
        // Check title and description first (faster, no file I/O)
        const titleMatch = lesson.title.toLowerCase().includes(searchTerm)
        const descMatch = lesson.description.toLowerCase().includes(searchTerm)

        // If title/description matches, include it
        if (titleMatch || descMatch) {
          results.push({
            domainId: domain.id,
            domainTitle: domain.title,
            moduleId: module.id,
            moduleTitle: module.title,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonDescription: lesson.description,
            matchInTitle: titleMatch,
            matchInDescription: descMatch,
            matchInContent: false
          })
        } else {
          // Only load content if title/description didn't match
          // This saves I/O for obvious matches
          const lessonContent = loadLessonByPath(domain.id, module.id, lesson.id)
          
          if (lessonContent && lessonContent.content) {
            const contentLower = lessonContent.content.toLowerCase()
            if (contentLower.includes(searchTerm)) {
              // Extract snippet around match (200 chars before/after)
              const contentIndex = contentLower.indexOf(searchTerm)
              const start = Math.max(0, contentIndex - 200)
              const end = Math.min(lessonContent.content.length, contentIndex + searchTerm.length + 200)
              const snippet = lessonContent.content.substring(start, end)
              
              results.push({
                domainId: domain.id,
                domainTitle: domain.title,
                moduleId: module.id,
                moduleTitle: module.title,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                lessonDescription: lesson.description,
                matchInTitle: false,
                matchInDescription: false,
                matchInContent: true,
                snippet: `...${snippet}...`
              })
            }
          }
        }
      }
    }
  }

  // Sort results: title matches first, then description, then content
  results.sort((a, b) => {
    if (a.matchInTitle && !b.matchInTitle) return -1
    if (!a.matchInTitle && b.matchInTitle) return 1
    if (a.matchInDescription && !b.matchInDescription) return -1
    if (!a.matchInDescription && b.matchInDescription) return 1
    return 0
  })

  return results
}

/**
 * Quick search that only checks titles and descriptions (no file I/O)
 * Used for instant filtering in client components
 */
export function quickSearchLessons(query: string): Array<{
  domainId: string
  moduleId: string
  lessonId: string
}> {
  if (!query || query.trim().length === 0) {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  const results: Array<{
    domainId: string
    moduleId: string
    lessonId: string
  }> = []

  for (const domain of completeCurriculumData) {
    for (const module of domain.modules) {
      for (const lesson of module.lessons) {
        // Filter to Year 1 content only
        if (!isYear1Lesson(domain.id, module.id, lesson.id)) {
          continue
        }
        if (
          lesson.title.toLowerCase().includes(searchTerm) ||
          lesson.description.toLowerCase().includes(searchTerm) ||
          module.title.toLowerCase().includes(searchTerm) ||
          domain.title.toLowerCase().includes(searchTerm)
        ) {
          results.push({
            domainId: domain.id,
            moduleId: module.id,
            lessonId: lesson.id
          })
        }
      }
    }
  }

  return results
}

