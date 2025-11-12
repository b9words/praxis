/**
 * Case response repository
 * Handles public responses to case studies with likes
 */

import { dbCall, withTransaction } from './utils'
import type { Prisma } from '@prisma/client'

export interface CreateOrUpdateResponseData {
  caseId: string
  userId: string
  simulationId?: string | null
  content: string
  isPublic: boolean
}

export type SortOption = 'top' | 'new' | 'following'

export interface ListPublicResponsesOptions {
  caseId: string
  limit?: number
  cursor?: string
  sortBy?: SortOption
  userId?: string // For "following" sort
}

/**
 * Create or update a case response (upsert by userId + caseId)
 */
export async function createOrUpdateResponse(data: CreateOrUpdateResponseData) {
  return dbCall(async (prisma) => {
    // Check if response already exists
    const existing = await prisma.caseResponse.findFirst({
      where: {
        caseId: data.caseId,
        userId: data.userId,
      },
    })

    if (existing) {
      // Update existing response
      return prisma.caseResponse.update({
        where: { id: existing.id },
        data: {
          content: data.content,
          isPublic: data.isPublic,
          simulationId: data.simulationId || null,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
        },
      })
    } else {
      // Create new response
      return prisma.caseResponse.create({
        data: {
          caseId: data.caseId,
          userId: data.userId,
          simulationId: data.simulationId || null,
          content: data.content,
          isPublic: data.isPublic,
          likesCount: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
        },
      })
    }
  })
}

/**
 * List public responses for a case, sorted by specified option
 */
export async function listPublicResponses(options: ListPublicResponsesOptions) {
  const { caseId, limit = 20, cursor, sortBy = 'top', userId } = options

  return dbCall(async (prisma) => {
    const where: Prisma.CaseResponseWhereInput = {
      caseId,
      isPublic: true,
    }

    // Determine orderBy based on sortBy
    let orderBy: Prisma.CaseResponseOrderByWithRelationInput[] = []
    if (sortBy === 'new') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sortBy === 'top') {
      orderBy = [
        { likesCount: 'desc' },
        { createdAt: 'desc' },
      ]
    } else if (sortBy === 'following' && userId) {
      // For following, we'd need a follow system - for now, fall back to top
      orderBy = [
        { likesCount: 'desc' },
        { createdAt: 'desc' },
      ]
    } else {
      // Default to top
      orderBy = [
        { likesCount: 'desc' },
        { createdAt: 'desc' },
      ]
    }

    if (cursor) {
      // Cursor-based pagination: find responses after the cursor
      const cursorResponse = await prisma.caseResponse.findUnique({
        where: { id: cursor },
        select: { likesCount: true, createdAt: true },
      })

      if (cursorResponse) {
        if (sortBy === 'new') {
          where.createdAt = { lt: cursorResponse.createdAt }
        } else {
          // Top or following
          where.OR = [
            {
              likesCount: { lt: cursorResponse.likesCount },
            },
            {
              likesCount: cursorResponse.likesCount,
              createdAt: { lt: cursorResponse.createdAt },
            },
          ]
        }
      }
    }

    const responses = await prisma.caseResponse.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy,
      take: limit + 1, // Fetch one extra to determine if there's a next page
    })

    const hasNextPage = responses.length > limit
    const items = hasNextPage ? responses.slice(0, limit) : responses
    const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1].id : null

    return {
      items,
      nextCursor,
      hasNextPage,
    }
  })
}

/**
 * Toggle like on a response (transactionally insert/delete and update count)
 */
export async function toggleLike(responseId: string, userId: string) {
  return withTransaction(async (tx) => {
    // Get response to find owner
    const response = await tx.caseResponse.findUnique({
      where: { id: responseId },
      select: { userId: true, case: { select: { id: true, title: true } } },
    })

    // Check if like already exists
    const existingLike = await tx.caseResponseLike.findUnique({
      where: {
        userId_responseId: {
          userId,
          responseId,
        },
      },
    })

    if (existingLike) {
      // Unlike: delete the like and decrement count
      await tx.caseResponseLike.delete({
        where: {
          userId_responseId: {
            userId,
            responseId,
          },
        },
      })

      await tx.caseResponse.update({
        where: { id: responseId },
        data: {
          likesCount: { decrement: 1 },
        },
      })

      return { liked: false }
    } else {
      // Like: create the like and increment count
      await tx.caseResponseLike.create({
        data: {
          userId,
          responseId,
        },
      })

      await tx.caseResponse.update({
        where: { id: responseId },
        data: {
          likesCount: { increment: 1 },
        },
      })

      // Notify response owner if different from liker (best-effort)
      if (response && response.userId !== userId) {
        try {
          const { createNotification } = await import('@/lib/notifications')
          await createNotification({
            userId: response.userId,
            type: 'like',
            title: 'Someone liked your response',
            message: `Your response to "${response.case.title}" received a like`,
            link: `/library/case-studies/${response.case.id}`,
            metadata: { responseId, likerId: userId },
          })
        } catch {
          // Notification creation failed, continue anyway
        }
      }

      return { liked: true }
    }
  })
}

/**
 * Get a single response by ID
 */
export async function getResponseById(responseId: string) {
  return dbCall(async (prisma) => {
    return prisma.caseResponse.findUnique({
      where: { id: responseId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
    })
  })
}

/**
 * Check if a user has liked a response
 */
export async function hasUserLiked(responseId: string, userId: string): Promise<boolean> {
  return dbCall(async (prisma) => {
    const like = await prisma.caseResponseLike.findUnique({
      where: {
        userId_responseId: {
          userId,
          responseId,
        },
      },
    })
    return !!like
  })
}





