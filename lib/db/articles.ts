/**
 * Articles repository
 * All article database operations go through here
 */

import type { Prisma } from '@prisma/client'
import { assertFound, dbCall, isColumnNotFoundError, withTransaction } from './utils'

export interface ArticleFilters {
  status?: string
  competencyId?: string
}

export interface CreateArticleData {
  competencyId: string
  title: string
  content?: string | null
  description?: string | null
  status?: string
  published?: boolean
  storagePath?: string | null
  metadata?: Record<string, any>
  createdBy: string
  updatedBy: string
}

export interface UpdateArticleData {
  title?: string
  content?: string | null
  description?: string | null
  status?: string
  published?: boolean
  storagePath?: string | null
  metadata?: Record<string, any>
  updatedBy: string
}

const defaultInclude = {
  competency: true,
  creator: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
} as const

/**
 * List articles with optional filters
 */
export async function listArticles(filters: ArticleFilters = {}) {
  const where: Prisma.ArticleWhereInput = {}
  
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }
  
  if (filters.competencyId) {
    where.competencyId = filters.competencyId
  }

  // For public queries, only show published content unless explicitly requesting all
  if (filters.status !== 'all' && !filters.status) {
    where.published = true
  }

  return dbCall(async (prisma) => {
    return prisma.article.findMany({
      where,
      include: defaultInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
}

/**
 * Get article by ID
 */
export async function getArticleById(id: string) {
  return dbCall(async (prisma) => {
    return prisma.article.findUnique({
      where: { id },
      include: defaultInclude,
    })
  }).catch((error: any) => {
    // If column doesn't exist (P2022), return null gracefully
    if (isColumnNotFoundError(error)) {
      return null
    }
    throw error
  })
}

/**
 * Create a new article
 */
export async function createArticle(data: CreateArticleData) {
  return dbCall(async (prisma) => {
    // Handle user FK references - set to null if empty string or invalid
    const createdBy = data.createdBy && data.createdBy.trim() ? data.createdBy : null
    const updatedBy = data.updatedBy && data.updatedBy.trim() ? data.updatedBy : null
    
    // If user IDs provided, verify they exist before creating
    if (createdBy) {
      try {
        const userExists = await prisma.profile.findUnique({
          where: { id: createdBy },
          select: { id: true },
        })
        if (!userExists) {
          console.warn(`[createArticle] User ${createdBy} not found, setting createdBy/updatedBy to null`)
          return prisma.article.create({
            data: {
              competencyId: data.competencyId,
              title: data.title,
              content: data.content ?? null,
              description: data.description ?? null,
              status: data.status ?? 'draft',
              published: data.published ?? false,
              storagePath: data.storagePath ?? null,
              metadata: data.metadata ?? {},
              createdBy: null,
              updatedBy: null,
            },
            include: defaultInclude,
          })
        }
      } catch (err) {
        console.warn('[createArticle] Failed to verify user, setting createdBy/updatedBy to null:', err)
        // Fall through to create with null
      }
    }
    
    return prisma.article.create({
      data: {
        competencyId: data.competencyId,
        title: data.title,
        content: data.content ?? null,
        description: data.description ?? null,
        status: data.status ?? 'draft',
        published: data.published ?? false,
        storagePath: data.storagePath ?? null,
        metadata: data.metadata ?? {},
        createdBy,
        updatedBy,
      },
      include: defaultInclude,
    })
  })
}

/**
 * Update an article
 */
export async function updateArticle(id: string, data: UpdateArticleData) {
  const existing = await getArticleById(id)
  assertFound(existing, 'Article')

  return dbCall(async (prisma) => {
    // Handle user FK reference - set to null if empty string or invalid
    let updatedBy = data.updatedBy && data.updatedBy.trim() ? data.updatedBy : null
    
    // If user ID provided, verify it exists before updating
    if (updatedBy) {
      try {
        const userExists = await prisma.profile.findUnique({
          where: { id: updatedBy },
          select: { id: true },
        })
        if (!userExists) {
          console.warn(`[updateArticle] User ${updatedBy} not found, setting updatedBy to null`)
          updatedBy = null
        }
      } catch (err) {
        console.warn('[updateArticle] Failed to verify user, setting updatedBy to null:', err)
        updatedBy = null
      }
    }
    
    return prisma.article.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.published !== undefined && { published: data.published }),
        ...(data.storagePath !== undefined && { storagePath: data.storagePath }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        updatedBy,
      },
      include: defaultInclude,
    })
  })
}

/**
 * Delete an article
 */
export async function deleteArticle(id: string) {
  const existing = await getArticleById(id)
  assertFound(existing, 'Article')

  return dbCall(async (prisma) => {
    return prisma.article.delete({
      where: { id },
    })
  })
}

/**
 * Bulk update article statuses
 */
export async function bulkUpdateArticleStatus(
  articleIds: string[],
  status: string,
  updatedBy: string
) {
  return dbCall(async (prisma) => {
    // Verify user exists before bulk updating
    let verifiedUpdatedBy: string | null = updatedBy && updatedBy.trim() ? updatedBy : null
    
    if (verifiedUpdatedBy) {
      try {
        const userExists = await prisma.profile.findUnique({
          where: { id: verifiedUpdatedBy },
          select: { id: true },
        })
        if (!userExists) {
          console.warn(`[bulkUpdateArticleStatus] User ${verifiedUpdatedBy} not found, setting updatedBy to null`)
          verifiedUpdatedBy = null
        }
      } catch (err) {
        console.warn('[bulkUpdateArticleStatus] Failed to verify user, setting updatedBy to null:', err)
        verifiedUpdatedBy = null
      }
    }
    
    return prisma.article.updateMany({
      where: {
        id: {
          in: articleIds,
        },
      },
      data: {
        status,
        updatedBy: verifiedUpdatedBy,
      },
    })
  })
}

/**
 * Bulk create articles
 */
export async function bulkCreateArticles(
  articles: Array<Omit<CreateArticleData, 'createdBy' | 'updatedBy'>>,
  userId: string
) {
  const { resolveCompetencyId } = await import('./competencies')
  
  const successes: Array<{ id: string; title: string }> = []
  const failures: Array<{ title: string; error: string }> = []
  
  // Verify user exists once (avoid FK constraint on createdBy/updatedBy)
  let verifiedUserId: string | null = userId && userId.trim() ? userId : null
  if (verifiedUserId) {
    try {
      const userExists = await dbCall(async (prisma) => {
        return await prisma.profile.findUnique({
          where: { id: verifiedUserId! },
          select: { id: true },
        })
      })
      if (!userExists) {
        console.warn(`[bulkCreateArticles] User ${verifiedUserId} not found, setting createdBy/updatedBy to null`)
        verifiedUserId = null
      }
    } catch (err) {
      console.warn('[bulkCreateArticles] Failed to verify user, setting createdBy/updatedBy to null:', err)
      verifiedUserId = null
    }
  }
  
  // Create articles one by one in individual transactions (allows partial success)
  for (const articleData of articles) {
    try {
      // Resolve competency ID - always succeeds (uses default if needed)
      const competencyId = await resolveCompetencyId(articleData.competencyId)
      
      // Create article in individual transaction
      const created = await dbCall(async (prisma) => {
        return await prisma.article.create({
          data: {
            title: articleData.title,
            content: articleData.content ?? null,
            competencyId,
            status: articleData.status ?? 'draft',
            published: articleData.published ?? false,
            storagePath: articleData.storagePath ?? null,
            metadata: articleData.metadata ?? {},
            description: articleData.description ?? null,
            createdBy: verifiedUserId,
            updatedBy: verifiedUserId,
          },
        })
      })
      
      successes.push({ id: created.id, title: created.title })
    } catch (createError: any) {
      const errorMessage = createError.message || createError.code || 'Unknown error'
      failures.push({ 
        title: articleData.title || 'Untitled', 
        error: errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage
      })
      console.error(`[bulkCreateArticles] Failed to create article "${articleData.title}":`, errorMessage)
    }
  }
  
  console.log(`[bulkCreateArticles] Summary: ${successes.length}/${articles.length} articles created successfully`)
  return { 
    count: successes.length, 
    articles: successes.map(s => ({ id: s.id, title: s.title })),
    successes,
    failures
  }
}

/**
 * Get published articles for a residency year
 */
export async function getResidencyArticles(residencyYear: number) {
  return dbCall(async (prisma) => {
    return prisma.article.findMany({
      where: {
        competency: {
          residencyYear,
        },
        published: true,
      },
      select: {
        id: true,
      },
    })
  })
}

/**
 * Get recent published articles (last 30 days)
 */
export async function getRecentArticles(days: number = 30) {
  return dbCall(async (prisma) => {
    return prisma.article.findMany({
      where: {
        published: true,
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        storagePath: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })
  })
}

/**
 * Count published articles for a residency year
 */
export async function countArticlesForResidency(residencyYear: number) {
  return dbCall(async (prisma) => {
    return prisma.article.count({
      where: {
        competency: {
          residencyYear,
        },
        published: true,
      },
    })
  }).catch(() => 0)
}

/**
 * Find article by storage path pattern
 * Tries exact match first, then contains match
 */
export async function findArticleByStoragePath(pattern: string) {
  return dbCall(async (prisma) => {
    // Try exact match first
    let article = await prisma.article.findFirst({
      where: {
        published: true,
        storagePath: pattern,
      },
      select: {
        id: true,
        title: true,
        description: true,
        storagePath: true,
        metadata: true,
        status: true,
      },
    })
    
    // If not found, try contains match
    if (!article) {
      article = await prisma.article.findFirst({
        where: {
          published: true,
          storagePath: {
            contains: pattern,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          storagePath: true,
          metadata: true,
          status: true,
        },
      })
    }
    
    return article
  }).catch(() => null)
}

/**
 * Bulk update article statuses
 */
export async function bulkUpdateArticleStatuses(
  articleIds: string[],
  status: string,
  updatedBy: string
) {
  return dbCall(async (prisma) => {
    // Verify user exists before bulk updating
    let verifiedUpdatedBy: string | null = updatedBy && updatedBy.trim() ? updatedBy : null
    
    if (verifiedUpdatedBy) {
      try {
        const userExists = await prisma.profile.findUnique({
          where: { id: verifiedUpdatedBy },
          select: { id: true },
        })
        if (!userExists) {
          console.warn(`[bulkUpdateArticleStatuses] User ${verifiedUpdatedBy} not found, setting updatedBy to null`)
          verifiedUpdatedBy = null
        }
      } catch (err) {
        console.warn('[bulkUpdateArticleStatuses] Failed to verify user, setting updatedBy to null:', err)
        verifiedUpdatedBy = null
      }
    }
    
    return prisma.article.updateMany({
      where: {
        id: { in: articleIds },
      },
      data: {
        status,
        updatedBy: verifiedUpdatedBy,
      },
    })
  })
}

