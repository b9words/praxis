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

export interface ListPublicResponsesOptions {
  caseId: string
  limit?: number
  cursor?: string
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
 * List public responses for a case, sorted by likes (desc) then createdAt (desc)
 */
export async function listPublicResponses(options: ListPublicResponsesOptions) {
  const { caseId, limit = 20, cursor } = options

  return dbCall(async (prisma) => {
    const where: Prisma.CaseResponseWhereInput = {
      caseId,
      isPublic: true,
    }

    if (cursor) {
      // Cursor-based pagination: find responses after the cursor
      const cursorResponse = await prisma.caseResponse.findUnique({
        where: { id: cursor },
        select: { likesCount: true, createdAt: true },
      })

      if (cursorResponse) {
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
      orderBy: [
        { likesCount: 'desc' },
        { createdAt: 'desc' },
      ],
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





