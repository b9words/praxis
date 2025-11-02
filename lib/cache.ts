import { unstable_cache } from 'next/cache'

/**
 * Caching utilities for Next.js Server Components
 * Uses Next.js unstable_cache for server-side caching
 * Can be extended with Redis in production if needed
 */

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

  return unstable_cache(
    async () => fn(),
    [cacheKey],
    {
      tags,
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
    return prisma.competency.findMany({
      orderBy: [
        { level: 'asc' },
        { displayOrder: 'asc' },
      ],
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
      return prisma.article.findUnique({
        where: { id: articleId },
        include: {
          competency: true,
        },
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
 * Cache case by ID
 */
export function getCachedCase(caseId: string) {
  return cache(
    async () => {
      const { prisma } = await import('./prisma/server')
      return prisma.case.findUnique({
        where: { id: caseId },
        include: {
          competencies: {
            include: {
              competency: true,
            },
          },
        },
      })
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

