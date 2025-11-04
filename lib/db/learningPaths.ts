/**
 * Learning paths repository
 * All learning path database operations go through here
 */

import { dbCall, withTransaction, assertFound, isColumnNotFoundError } from './utils'
import type { Prisma } from '@prisma/client'

export interface LearningPathItem {
  type: string
  domain?: string | null
  module?: string | null
  lesson?: string | null
  caseId?: string | null
}

export interface CreateLearningPathData {
  title: string
  description?: string | null
  duration: string
  status?: string
  items?: LearningPathItem[]
}

export interface UpdateLearningPathData {
  title?: string
  description?: string | null
  duration?: string
  status?: string
  items?: LearningPathItem[]
}

const defaultInclude = {
  items: {
    orderBy: { order: 'asc' as const },
  },
} as const

/**
 * List all learning paths
 */
export async function listLearningPaths() {
  return dbCall(async (prisma) => {
    return prisma.learningPath.findMany({
      include: defaultInclude,
      orderBy: { createdAt: 'desc' },
    })
  })
}

/**
 * Get learning path by ID
 */
export async function getLearningPathById(id: string) {
  return dbCall(async (prisma) => {
    return prisma.learningPath.findUnique({
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
 * Get learning path by slug
 */
export async function getLearningPathBySlug(slug: string) {
  return dbCall(async (prisma) => {
    return prisma.learningPath.findUnique({
      where: { slug },
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
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

/**
 * Create a new learning path
 */
export async function createLearningPath(data: CreateLearningPathData) {
  const slug = generateSlug(data.title)

  // Check if slug already exists
  const existing = await getLearningPathBySlug(slug)
  if (existing) {
    throw new Error('A learning path with this title already exists')
  }

  return dbCall(async (prisma) => {
    return prisma.learningPath.create({
      data: {
        slug,
        title: data.title,
        description: data.description ?? null,
        duration: data.duration,
        status: data.status ?? 'draft',
        items: data.items
          ? {
              create: data.items.map((item, index) => ({
                order: index,
                type: item.type,
                domain: item.domain ?? null,
                module: item.module ?? null,
                lesson: item.lesson ?? null,
                caseId: item.caseId ?? null,
              })),
            }
          : undefined,
      },
      include: defaultInclude,
    })
  })
}

/**
 * Update learning path and optionally replace items
 */
export async function updatePathWithItems(
  id: string,
  data: UpdateLearningPathData
) {
  const existing = await getLearningPathById(id)
  assertFound(existing, 'Learning path')

  // Update slug if title changed
  let slug = existing.slug
  if (data.title && data.title !== existing.title) {
    slug = generateSlug(data.title)

    // Check if new slug conflicts
    const conflict = await getLearningPathBySlug(slug)
    if (conflict && conflict.id !== id) {
      throw new Error('A learning path with this title already exists')
    }
  }

  return withTransaction(async (tx) => {
    // Update path
    const updateData: Prisma.LearningPathUpdateInput = {}
    if (slug !== existing.slug) updateData.slug = slug
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description ?? null
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.status !== undefined) updateData.status = data.status

    await tx.learningPath.update({
      where: { id },
      data: updateData,
    })

    // Update items if provided
    if (data.items !== undefined && Array.isArray(data.items)) {
      // Delete all existing items
      await tx.learningPathItem.deleteMany({
        where: { pathId: id },
      })

      // Create new items
      if (data.items.length > 0) {
        await tx.learningPathItem.createMany({
          data: data.items.map((item, index) => ({
            pathId: id,
            order: index,
            type: item.type,
            domain: item.domain ?? null,
            module: item.module ?? null,
            lesson: item.lesson ?? null,
            caseId: item.caseId ?? null,
          })),
        })
      }
    }

    // Fetch updated path with items
    return await tx.learningPath.findUnique({
      where: { id },
      include: defaultInclude,
    })
  })
}

/**
 * Delete a learning path
 */
export async function deleteLearningPath(id: string) {
  const existing = await getLearningPathById(id)
  assertFound(existing, 'Learning path')

  return dbCall(async (prisma) => {
    return prisma.learningPath.delete({
      where: { id },
    })
  })
}

