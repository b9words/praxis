/**
 * Article progress repository
 * All article progress database operations go through here
 */

import { dbCall } from './utils'
import type { Prisma } from '@prisma/client'

/**
 * Get completed article IDs for a user
 */
export async function getCompletedArticleIds(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.userArticleProgress.findMany({
      where: { userId, status: 'completed' },
      select: { articleId: true },
    })
  }).catch(() => [])
}

/**
 * Get recent completed articles with details
 */
export async function getRecentCompletedArticles(userId: string, limit: number = 5) {
  return dbCall(async (prisma) => {
    return prisma.userArticleProgress.findMany({
      where: { userId, status: 'completed' },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            competency: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    })
  }).catch(() => [])
}

/**
 * Get article progress completion dates
 */
export async function getArticleProgressCompletionDates(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.userArticleProgress.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    })
  }).catch(() => [])
}

/**
 * List article progress with filters
 */
export async function listArticleProgress(filters: {
  userId: string
  articleId?: string
  status?: string
}) {
  return dbCall(async (prisma) => {
    const where: any = {
      userId: filters.userId,
    }
    
    if (filters.articleId) {
      where.articleId = filters.articleId
    }
    
    if (filters.status) {
      where.status = filters.status
    }

    return prisma.userArticleProgress.findMany({
      where,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            competency: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  }).catch(() => [])
}

/**
 * Upsert article progress
 */
export async function upsertArticleProgress(data: {
  userId: string
  articleId: string
  status: string
}) {
  return dbCall(async (prisma) => {
    return prisma.userArticleProgress.upsert({
      where: {
        userId_articleId: {
          userId: data.userId,
          articleId: data.articleId,
        },
      },
      update: {
        status: data.status,
        completedAt: data.status === 'completed' ? new Date() : undefined,
      },
      create: {
        userId: data.userId,
        articleId: data.articleId,
        status: data.status,
        completedAt: data.status === 'completed' ? new Date() : null,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
  })
}

/**
 * Update article progress
 */
export async function updateArticleProgress(
  userId: string,
  articleId: string,
  status: string
) {
  return dbCall(async (prisma) => {
    return prisma.userArticleProgress.update({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })
  })
}

/**
 * Delete article progress
 */
export async function deleteArticleProgress(userId: string, articleId: string) {
  return dbCall(async (prisma) => {
    return prisma.userArticleProgress.delete({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    })
  })
}

/**
 * Count completed articles for a user with residency filter
 */
export async function countCompletedArticlesForResidency(
  userId: string,
  residencyYear: number
) {
  return dbCall(async (prisma) => {
    return prisma.userArticleProgress.count({
      where: {
        userId,
        status: 'completed',
        article: {
          competency: {
            residencyYear,
          },
        },
      },
    })
  }).catch(() => 0)
}

