/**
 * Caching utilities for Next.js Server Components
 * Uses Next.js unstable_cache for server-side caching
 * Can be extended with Redis in production if needed
 * 
 * Server-only: Cannot be used in client components
 */

import { unstable_cache } from 'next/cache'
import { withConnectionRetry } from './prisma/retry'

interface CacheOptions {
  tags?: string[]
  revalidate?: number | false
}

/**
 * Cache a function result with Next.js unstable_cache
 * @param fn - The function to cache
 * @param keyParts - Array of strings to form the cache key
 * @param options - Cache options (tags for invalidation, revalidate time)
 */
export function cache<T>(
  fn: () => Promise<T> | T,
  keyParts: string[],
  options: CacheOptions = {}
): () => Promise<T> {
  const cacheKey = keyParts.join(':')
  const { tags = [], revalidate = 3600 } = options // Default 1 hour revalidation

  // Filter out undefined/null tag values to prevent warnings
  const validTags = tags.filter((tag): tag is string => typeof tag === 'string' && tag !== undefined && tag !== null)

  return unstable_cache(
    async () => fn(),
    [cacheKey],
    {
      tags: validTags,
      revalidate: revalidate === false ? false : revalidate,
    }
  )
}

/**
 * Cache tags for organized invalidation
 */
export const CacheTags = {
  CURRICULUM: 'curriculum',
  COMPETENCIES: 'competencies',
  ARTICLES: 'articles',
  CASES: 'cases',
  USER_PROGRESS: 'user-progress',
  USERS: 'users',
  SIMULATIONS: 'simulations',
  DASHBOARD: 'dashboard',
  ADMIN: 'admin',
  SYSTEM: 'system',
  APPLICATIONS: 'applications',
} as const

/**
 * Cache curriculum structure (changes rarely)
 */
export const getCachedCurriculum = cache(
  async () => {
    // This will be implemented in the component that uses it
    // For now, return a placeholder
    return null
  },
  ['curriculum', 'structure'],
  {
    tags: [CacheTags.CURRICULUM],
    revalidate: 86400, // 24 hours
  }
)

/**
 * Cache competencies list
 */
export const getCachedCompetencies = cache(
  async () => {
    const { prisma } = await import('./prisma/server')
    return withConnectionRetry(async () => {
    return prisma.competency.findMany({
      orderBy: [
        { level: 'asc' },
        { displayOrder: 'asc' },
      ],
      })
    })
  },
  ['competencies', 'all'],
  {
    tags: [CacheTags.COMPETENCIES],
    revalidate: 86400, // 24 hours - competencies change rarely
  }
)

/**
 * Cache article by ID
 */
export function getCachedArticle(articleId: string) {
  return cache(
    async () => {
      const { prisma } = await import('./prisma/server')
      return withConnectionRetry(async () => {
      return prisma.article.findUnique({
        where: { id: articleId },
        include: {
          competency: true,
        },
        })
      })
    },
    ['article', articleId],
    {
      tags: [CacheTags.ARTICLES, `article-${articleId}`],
      revalidate: 3600, // 1 hour
    }
  )()
}

/**
 * Cache case by ID (with fallback to JSON files)
 */
export function getCachedCase(caseId: string) {
  return cache(
    async () => {
      const { getCaseByIdWithCompetencies } = await import('./db/cases')
      let caseItem = await getCaseByIdWithCompetencies(caseId)
      
      // Fallback to JSON files if not found in database
      if (!caseItem) {
        const { loadInteractiveSimulation } = await import('./case-study-loader')
        const jsonCase = loadInteractiveSimulation(caseId)
        
        if (jsonCase) {
          // Convert JSON case to database format
          return {
            id: jsonCase.caseId, // Use caseId as the ID for JSON cases
            title: jsonCase.title,
            description: jsonCase.description,
            difficulty: jsonCase.difficulty,
            estimatedMinutes: jsonCase.estimatedDuration,
            published: true,
            metadata: {
              caseId: jsonCase.caseId,
              version: jsonCase.version,
            },
            competencies: jsonCase.competencies?.map((comp: string) => ({
              competency: { name: comp }
            })) || [],
            briefingDoc: jsonCase.description || '',
            datasets: null,
            prerequisites: null,
          } as any
        }
      }
      
      return caseItem
    },
    ['case', caseId],
    {
      tags: [CacheTags.CASES, `case-${caseId}`],
      revalidate: 3600, // 1 hour
    }
  )()
}

/**
 * Revalidate cache by tag
 * This can be called from API routes or server actions to invalidate specific caches
 */
export async function revalidateCache(tag: string, path?: string) {
  const { revalidateTag } = await import('next/cache')
  if (path) {
    revalidateTag(tag, path)
  } else {
    (revalidateTag as any)(tag)
  }
}

/**
 * Revalidate article cache
 */
export async function revalidateArticleCache(articleId: string) {
  await revalidateCache(CacheTags.ARTICLES)
  await revalidateCache(`article-${articleId}`)
}

/**
 * Revalidate case cache
 */
export async function revalidateCaseCache(caseId: string) {
  await revalidateCache(CacheTags.CASES)
  await revalidateCache(`case-${caseId}`)
}

/**
 * Revalidate curriculum cache
 */
export async function revalidateCurriculumCache() {
  await revalidateCache(CacheTags.CURRICULUM)
}

/**
 * Cache user-specific data with userId in cache key
 * @param userId - User ID to include in cache key
 * @param fn - The function to cache
 * @param keyParts - Array of strings to form the cache key (userId will be prepended)
 * @param options - Cache options (tags for invalidation, revalidate time)
 */
export function getCachedUserData<T>(
  userId: string,
  fn: () => Promise<T> | T,
  keyParts: string[],
  options: CacheOptions = {}
): () => Promise<T> {
  return cache(fn, ['user', userId, ...keyParts], {
    ...options,
    tags: [...(options.tags || []), `user-${userId}`],
  })
}

