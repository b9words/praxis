/**
 * Articles repository
 * All article database operations go through here
 */

import { dbCall, assertFound, isColumnNotFoundError } from './utils'
import type { Prisma } from '@prisma/client'

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
    return prisma.article.create({
      data: {
        competencyId: data.competencyId,
        title: data.title,
        content: data.content ?? null,
        description: data.description ?? null,
        status: data.status ?? 'draft',
        storagePath: data.storagePath ?? null,
        metadata: data.metadata ?? {},
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
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
    return prisma.article.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.storagePath !== undefined && { storagePath: data.storagePath }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        updatedBy: data.updatedBy,
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
    return prisma.article.updateMany({
      where: {
        id: {
          in: articleIds,
        },
      },
      data: {
        status,
        updatedBy,
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
  return dbCall(async (prisma) => {
    return prisma.article.createMany({
      data: articles.map((article) => ({
        title: article.title,
        content: article.content ?? null,
        competencyId: article.competencyId,
        status: article.status ?? 'draft',
        storagePath: article.storagePath ?? null,
        metadata: article.metadata ?? {},
        description: article.description ?? null,
        createdBy: userId,
        updatedBy: userId,
      })),
    })
  })
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
        status: 'published',
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
        status: 'published',
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
        status: 'published',
      },
    })
  }).catch(() => 0)
}

/**
 * Find article by storage path pattern
 */
export async function findArticleByStoragePath(pattern: string) {
  return dbCall(async (prisma) => {
    return prisma.article.findFirst({
      where: {
        status: 'published',
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
    return prisma.article.updateMany({
      where: {
        id: { in: articleIds },
      },
      data: {
        status,
        updatedBy,
      },
    })
  })
}

