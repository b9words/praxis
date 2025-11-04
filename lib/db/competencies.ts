/**
 * Competencies repository
 * All competency database operations go through here
 */

import { dbCall, assertFound, isColumnNotFoundError } from './utils'
import type { Prisma } from '@prisma/client'

export interface CompetencyFilters {
  level?: string
  parentId?: string | null
  residencyYear?: number
}

const defaultInclude = {
  parent: true,
  children: true,
} as const

/**
 * List competencies with optional filters
 */
export async function listCompetencies(filters: CompetencyFilters = {}) {
  const where: Prisma.CompetencyWhereInput = {}
  
  if (filters.level) {
    where.level = filters.level
  }
  
  if (filters.parentId !== undefined) {
    where.parentId = filters.parentId
  }
  
  if (filters.residencyYear !== undefined) {
    where.residencyYear = filters.residencyYear
  }

  return dbCall(async (prisma) => {
    return prisma.competency.findMany({
      where,
      include: defaultInclude,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    })
  })
}

/**
 * Get competency by ID
 */
export async function getCompetencyById(id: string) {
  return dbCall(async (prisma) => {
    return prisma.competency.findUnique({
      where: { id },
      include: {
        ...defaultInclude,
        articles: {
          select: {
            id: true,
            title: true,
          },
        },
      },
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
 * Get competency by ID (basic)
 */
export async function getCompetencyBasic(id: string) {
  return dbCall(async (prisma) => {
    return prisma.competency.findUnique({
      where: { id },
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
 * Create a new competency
 */
export async function createCompetency(data: {
  name: string
  description?: string | null
  parentId?: string | null
  level: string
  residencyYear?: number | null
  displayOrder?: number
}) {
  return dbCall(async (prisma) => {
    return prisma.competency.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        parentId: data.parentId ?? null,
        level: data.level,
        residencyYear: data.residencyYear ?? null,
        displayOrder: data.displayOrder ?? 0,
      },
      include: defaultInclude,
    })
  })
}

/**
 * Update a competency
 */
export async function updateCompetency(
  id: string,
  data: {
    name?: string
    description?: string | null
    parentId?: string | null
    level?: string
    residencyYear?: number | null
    displayOrder?: number
  }
) {
  const existing = await getCompetencyBasic(id)
  assertFound(existing, 'Competency')

  return dbCall(async (prisma) => {
    const updateData: Prisma.CompetencyUpdateInput = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.parentId !== undefined) updateData.parentId = data.parentId
    if (data.level !== undefined) updateData.level = data.level
    if (data.residencyYear !== undefined) updateData.residencyYear = data.residencyYear
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder

    return prisma.competency.update({
      where: { id },
      data: updateData,
      include: defaultInclude,
    })
  })
}

/**
 * Delete a competency
 */
export async function deleteCompetency(id: string) {
  const existing = await dbCall(async (prisma) => {
    return prisma.competency.findUnique({
      where: { id },
      include: {
        children: true,
        articles: true,
      },
    })
  })
  
  assertFound(existing, 'Competency')

  // Check for dependencies
  if (existing.children && existing.children.length > 0) {
    throw new Error('Cannot delete competency with child competencies. Delete children first.')
  }

  if (existing.articles && existing.articles.length > 0) {
    throw new Error('Cannot delete competency with associated articles. Remove articles first.')
  }

  return dbCall(async (prisma) => {
    return prisma.competency.delete({
      where: { id },
    })
  })
}

