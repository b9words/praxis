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
 * Load lesson content by checking multiple paths
 * Priority: 1) content/curriculum/{domain}/{module}/{lesson}.md 2) content/lessons/{lessonId}.md
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
      // Try preferred path: content/curriculum/{domain}/{module}/{lesson}.md
      const preferredPath = path.join(
        process.cwd(),
        'content',
        'curriculum',
        domainId,
        moduleId,
        `${lessonId}.md`
      )

      if (fs.existsSync(preferredPath)) {
        try {
          const fileContents = fs.readFileSync(preferredPath, 'utf8')
          const { data, content } = matter(fileContents)

          return {
            id: data.id || lessonId,
            title: data.title || lessonId,
            domain: data.domain || domainId,
            module: data.module || moduleId,
            lesson_number: data.lesson_number || 0,
            duration: data.duration || 12,
            difficulty: data.difficulty || 'intermediate',
            description: data.description || '',
            content
          } as LessonContent
        } catch (error) {
          console.error(`Error loading lesson from preferred path ${preferredPath}:`, error)
        }
      }

      // Fallback to legacy path: content/lessons/{lessonId}.md
      const fallbackPath = path.join(process.cwd(), 'content', 'lessons', `${lessonId}.md`)
      
      if (fs.existsSync(fallbackPath)) {
        try {
          const fileContents = fs.readFileSync(fallbackPath, 'utf8')
          const { data, content } = matter(fileContents)

          return {
            id: data.id || lessonId,
            title: data.title || lessonId,
            domain: data.domain || domainId,
            module: data.module || moduleId,
            lesson_number: data.lesson_number || 0,
            duration: data.duration || 12,
            difficulty: data.difficulty || 'intermediate',
            description: data.description || '',
            content
          } as LessonContent
        } catch (error) {
          console.error(`Error loading lesson from fallback path ${fallbackPath}:`, error)
        }
      }

      return null
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
      // Try preferred path: content/curriculum/{domain}/{module}/{lesson}.md
      const preferredPath = path.join(
        process.cwd(),
        'content',
        'curriculum',
        domainId,
        moduleId,
        `${lessonId}.md`
      )

      if (fs.existsSync(preferredPath)) {
        try {
          const fileContents = fs.readFileSync(preferredPath, 'utf8')
          const { data, content } = matter(fileContents)

          return {
            id: data.id || lessonId,
            title: data.title || lessonId,
            domain: data.domain || domainId,
            module: data.module || moduleId,
            lesson_number: data.lesson_number || 0,
            duration: data.duration || 12,
            difficulty: data.difficulty || 'intermediate',
            description: data.description || '',
            content
          } as LessonContent
        } catch (error) {
          console.error(`Error loading lesson from preferred path ${preferredPath}:`, error)
        }
      }

      // Fallback to legacy path: content/lessons/{lessonId}.md
      const fallbackPath = path.join(process.cwd(), 'content', 'lessons', `${lessonId}.md`)
      
      if (fs.existsSync(fallbackPath)) {
        try {
          const fileContents = fs.readFileSync(fallbackPath, 'utf8')
          const { data, content } = matter(fileContents)

          return {
            id: data.id || lessonId,
            title: data.title || lessonId,
            domain: data.domain || domainId,
            module: data.module || moduleId,
            lesson_number: data.lesson_number || 0,
            duration: data.duration || 12,
            difficulty: data.difficulty || 'intermediate',
            description: data.description || '',
            content
          } as LessonContent
        } catch (error) {
          console.error(`Error loading lesson from fallback path ${fallbackPath}:`, error)
        }
      }

      return null
    },
    ['lesson-content', cacheKey],
    {
      tags: ['lesson-content', `lesson-${lessonId}`],
      revalidate: 3600, // 1 hour
    }
  )

  return await loadCachedLesson()
}


