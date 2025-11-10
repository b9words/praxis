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
    if (data.parentId !== undefined) {
      updateData.parent = data.parentId ? { connect: { id: data.parentId } } : { disconnect: true }
    }
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

/**
 * Ensure default "General" competency exists (idempotent)
 * Returns the ID of the default competency, creating it if necessary
 */
export async function ensureDefaultCompetency(prisma?: any): Promise<string> {
  const executor = prisma ? async (fn: (p: any) => Promise<any>) => fn(prisma) : dbCall
  
  return executor(async (p) => {
    // Try to find existing "General" competency
    let defaultComp = await p.competency.findFirst({
      where: {
        name: 'General',
        level: 'domain',
      },
      select: { id: true },
    })

    if (!defaultComp) {
      // Create it if it doesn't exist
      defaultComp = await p.competency.create({
        data: {
          name: 'General',
          description: 'Default competency for articles without a specific competency',
          level: 'domain',
          displayOrder: 0,
        },
        select: { id: true },
      })
    }

    return defaultComp.id
  })
}

/**
 * Resolve competency ID - returns provided ID if valid, else default competency ID
 */
export async function resolveCompetencyId(maybeId?: string | null, prisma?: any): Promise<string> {
  if (maybeId) {
    const executor = prisma ? async (fn: (p: any) => Promise<any>) => fn(prisma) : dbCall
    
    try {
      const exists = await executor(async (p) => {
        return await p.competency.findUnique({
          where: { id: maybeId },
          select: { id: true },
        })
      })
      
      if (exists) {
        return maybeId
      }
    } catch (err) {
      // If lookup fails, fall through to default
      console.warn(`[resolveCompetencyId] Failed to verify competency ${maybeId}, using default:`, err)
    }
  }
  
  // Return default competency ID
  return ensureDefaultCompetency(prisma)
}

