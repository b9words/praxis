import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import { cache } from './cache'

export interface LessonContent {
  id: string
  title: string
  domain: string
  module: string
  lesson_number: number
  duration: number
  difficulty: string
  description: string
  content: string
}

/**
 * Helper function to try loading from numbered path first, then unnumbered
 */
async function tryLoadLessonFile(domainId: string, moduleId: string, lessonId: string): Promise<LessonContent | null> {
  // Try numbered path first: content/curriculum/{domainNumber}-{domain}/{moduleNumber}-{module}/{lessonNumber}-{lesson}.md
  try {
    const { getDomainById, getModuleById, getLessonById, completeCurriculumData } = await import('./curriculum-data')
    const domain = getDomainById(domainId)
    const module = domain ? getModuleById(domainId, moduleId) : null
    const lesson = module ? getLessonById(domainId, moduleId, lessonId) : null
    
    // If we have curriculum data, try numbered path
    if (domain && module && lesson) {
      const domainIndex = completeCurriculumData.findIndex(d => d.id === domainId)
      if (domainIndex >= 0) {
        const domainNumber = String(domainIndex + 1).padStart(2, '0')
        const moduleNumber = String(module.number).padStart(2, '0')
        const lessonNumber = String(lesson.number).padStart(2, '0')
        
        const numberedPath = path.join(
          process.cwd(),
          'content',
          'curriculum',
          `${domainNumber}-${domainId}`,
          `${moduleNumber}-${moduleId}`,
          `${lessonNumber}-${lessonId}.md`
        )
        
        if (fs.existsSync(numberedPath)) {
          try {
            const fileContents = fs.readFileSync(numberedPath, 'utf8')
            const { data, content } = matter(fileContents)

            // Normalize frontmatter fields to match curriculum templates
            const duration = data.duration ?? data.estimated_reading_time ?? 12
            const difficulty = data.difficulty ?? 'intermediate'

            return {
              id: data.id || lessonId,
              title: data.title || lessonId,
              domain: data.domain || domainId,
              module: data.module || moduleId,
              lesson_number: data.lesson_number || 0,
              duration,
              difficulty,
              description: data.description || '',
              content
            } as LessonContent
          } catch (error) {
            console.error(`Error loading lesson from numbered path ${numberedPath}:`, error)
          }
        } else {
          // Log when numbered path doesn't exist for debugging
          console.warn(`Numbered path does not exist: ${numberedPath}`)
        }
      }
    } else {
      // Log when lesson not found in curriculum data
      console.warn(`Lesson not found in curriculum data: ${domainId}/${moduleId}/${lessonId}`)
    }
  } catch (error) {
    // If curriculum-data import fails, continue to fallback
    console.warn('Could not load curriculum data for numbered path lookup:', error)
  }
  
  // Fallback to unnumbered path: content/curriculum/{domain}/{module}/{lesson}.md
  const unnumberedPath = path.join(
    process.cwd(),
    'content',
    'curriculum',
    domainId,
    moduleId,
    `${lessonId}.md`
  )

  if (fs.existsSync(unnumberedPath)) {
    try {
      const fileContents = fs.readFileSync(unnumberedPath, 'utf8')
      const { data, content } = matter(fileContents)

      // Normalize frontmatter fields to match curriculum templates
      const duration = data.duration ?? data.estimated_reading_time ?? 12
      const difficulty = data.difficulty ?? 'intermediate'

      return {
        id: data.id || lessonId,
        title: data.title || lessonId,
        domain: data.domain || domainId,
        module: data.module || moduleId,
        lesson_number: data.lesson_number || 0,
        duration,
        difficulty,
        description: data.description || '',
        content
      } as LessonContent
    } catch (error) {
      console.error(`Error loading lesson from unnumbered path ${unnumberedPath}:`, error)
    }
  }

  // Final fallback to legacy path: content/lessons/{lessonId}.md
  const legacyPath = path.join(process.cwd(), 'content', 'lessons', `${lessonId}.md`)
  
  if (fs.existsSync(legacyPath)) {
    try {
      const fileContents = fs.readFileSync(legacyPath, 'utf8')
      const { data, content } = matter(fileContents)

      // Normalize frontmatter fields to match curriculum templates
      const duration = data.duration ?? data.estimated_reading_time ?? 12
      const difficulty = data.difficulty ?? 'intermediate'

      return {
        id: data.id || lessonId,
        title: data.title || lessonId,
        domain: data.domain || domainId,
        module: data.module || moduleId,
        lesson_number: data.lesson_number || 0,
        duration,
        difficulty,
        description: data.description || '',
        content
      } as LessonContent
    } catch (error) {
      console.error(`Error loading lesson from legacy path ${legacyPath}:`, error)
    }
  }

  return null
}

/**
 * Load lesson content by checking multiple paths
 * Priority: 1) Numbered path 2) Unnumbered path 3) Legacy path
 * Uses Next.js unstable_cache for server-side caching
 */
export function loadLessonByPath(
  domainId: string,
  moduleId: string,
  lessonId: string
): LessonContent | null {
  const cacheKey = `${domainId}:${moduleId}:${lessonId}`
  
  // Note: This sync function cannot use unstable_cache directly (it's async)
  // For server-side caching, use loadLessonByPathAsync() instead
  // Keeping this for backward compatibility but it won't use Next.js cache
  const loadCachedLesson = cache(
    async () => {
      return await tryLoadLessonFile(domainId, moduleId, lessonId)
    },
    ['lesson-content', cacheKey],
    {
      tags: ['lesson-content', `lesson-${lessonId}`],
      revalidate: 3600, // 1 hour
    }
  )

  // For client-side calls, we can't use unstable_cache, so return null
  // Server-side, this will use the cache
  if (typeof window !== 'undefined') {
    // Client-side: return null or implement client-side caching if needed
    // For now, this function should primarily be called server-side
    return null
  }

  // Server-side: use cached loader
  // Note: This requires async handling in the calling code
  // For sync compatibility, we'll need to refactor this
  // For now, keeping sync version but with cache wrapper for Next.js Server Components
  try {
    // Attempt to use cached version (this is a limitation - unstable_cache is async)
    // We need to make this function async to use unstable_cache properly
    return null // Temporary - will need to make this async
  } catch {
    return null
  }
}

/**
 * Async version for use in Server Components with Next.js cache
 */
export async function loadLessonByPathAsync(
  domainId: string,
  moduleId: string,
  lessonId: string
): Promise<LessonContent | null> {
  const cacheKey = `${domainId}:${moduleId}:${lessonId}`
  
  const loadCachedLesson = cache(
    async () => {
      return await tryLoadLessonFile(domainId, moduleId, lessonId)
    },
    ['lesson-content', cacheKey],
    {
      tags: ['lesson-content', `lesson-${lessonId}`],
      revalidate: 3600, // 1 hour
    }
  )

  return await loadCachedLesson()
}
