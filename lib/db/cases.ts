/**
 * Cases repository
 * All case database operations go through here
 */

import { dbCall, withTransaction, assertFound, isColumnNotFoundError } from './utils'
import type { Prisma } from '@prisma/client'

export interface CaseFilters {
  status?: string
}

export interface CreateCaseData {
  title: string
  briefingDoc?: string | null
  description?: string | null
  datasets?: any
  rubric: any
  status?: string
  difficulty?: string | null
  estimatedMinutes?: number | null
  prerequisites?: any
  storagePath?: string | null
  metadata?: Record<string, any>
  competencyIds?: string[]
  createdBy: string
  updatedBy: string
}

export interface UpdateCaseData {
  title?: string
  briefingDoc?: string | null
  description?: string | null
  datasets?: any
  rubric?: any
  status?: string
  difficulty?: string | null
  estimatedMinutes?: number | null
  prerequisites?: any
  storagePath?: string | null
  metadata?: Record<string, any>
  competencyIds?: string[]
  updatedBy: string
}

const defaultInclude = {
  creator: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
  competencies: {
    include: {
      competency: true,
    },
  },
} as const

/**
 * List cases with optional filters
 */
export async function listCases(filters: CaseFilters = {}) {
  const where: Prisma.CaseWhereInput = {}
  
  if (filters.status) {
    where.status = filters.status
  }

  return dbCall(async (prisma) => {
    return prisma.case.findMany({
      where,
      include: defaultInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
}

/**
 * Get case by ID
 */
export async function getCaseById(id: string) {
  return dbCall(async (prisma) => {
    return prisma.case.findUnique({
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
 * Create a new case
 */
export async function createCase(data: CreateCaseData) {
  return dbCall(async (prisma) => {
    return prisma.case.create({
      data: {
        title: data.title,
        briefingDoc: data.briefingDoc ?? null,
        description: data.description ?? null,
        datasets: data.datasets ?? null,
        rubric: data.rubric,
        status: data.status ?? 'draft',
        difficulty: data.difficulty ?? null,
        estimatedMinutes: data.estimatedMinutes ?? null,
        prerequisites: data.prerequisites ?? [],
        storagePath: data.storagePath ?? null,
        metadata: data.metadata ?? {},
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
        competencies: data.competencyIds && data.competencyIds.length > 0
          ? {
              create: data.competencyIds.map((compId) => ({
                competencyId: compId,
              })),
            }
          : undefined,
      },
      include: defaultInclude,
    })
  })
}

/**
 * Update case and optionally replace competencies
 */
/**
 * Bulk create cases
 */
export async function bulkCreateCases(
  cases: Array<Omit<CreateCaseData, 'createdBy' | 'updatedBy'>>,
  userId: string
) {
  return withTransaction(async (tx) => {
    const createdCases = []
    
    for (const caseData of cases) {
      // Create case with competencies
      const created = await tx.case.create({
        data: {
          title: caseData.title,
          briefingDoc: caseData.briefingDoc ?? null,
          description: caseData.description ?? null,
          datasets: caseData.datasets ?? null,
          rubric: caseData.rubric,
          status: caseData.status ?? 'draft',
          difficulty: caseData.difficulty ?? null,
          estimatedMinutes: caseData.estimatedMinutes ?? null,
          prerequisites: caseData.prerequisites ?? [],
          storagePath: caseData.storagePath ?? null,
          metadata: caseData.metadata ?? {},
          createdBy: userId,
          updatedBy: userId,
          competencies: caseData.competencyIds && caseData.competencyIds.length > 0
            ? {
                create: caseData.competencyIds.map((compId) => ({
                  competencyId: compId,
                })),
              }
            : undefined,
        },
        include: defaultInclude,
      })
      
      createdCases.push(created)
    }
    
    return { count: createdCases.length, cases: createdCases }
  })
}

export async function updateCaseWithCompetencies(
  id: string,
  data: UpdateCaseData
) {
  const existing = await getCaseById(id)
  assertFound(existing, 'Case')

  return withTransaction(async (tx) => {
    // Update competencies if provided
    if (data.competencyIds !== undefined) {
      // Delete existing relations
      await tx.caseCompetency.deleteMany({
        where: { caseId: id },
      })
      
      // Create new relations if any
      if (data.competencyIds.length > 0) {
        await tx.caseCompetency.createMany({
          data: data.competencyIds.map((compId) => ({
            caseId: id,
            competencyId: compId,
          })),
        })
      }
    }

    // Update case fields
    const updateData: Prisma.CaseUpdateInput = {
      updatedBy: data.updatedBy,
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.briefingDoc !== undefined) updateData.briefingDoc = data.briefingDoc
    if (data.description !== undefined) updateData.description = data.description
    if (data.datasets !== undefined) updateData.datasets = data.datasets
    if (data.rubric !== undefined) updateData.rubric = data.rubric
    if (data.status !== undefined) updateData.status = data.status
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty
    if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes
    if (data.prerequisites !== undefined) updateData.prerequisites = data.prerequisites
    if (data.storagePath !== undefined) updateData.storagePath = data.storagePath
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    // Update and return with relations
    return await tx.case.update({
      where: { id },
      data: updateData,
      include: defaultInclude,
    })
  })
}

/**
 * Delete a case
 */
export async function deleteCase(id: string) {
  const existing = await getCaseById(id)
  assertFound(existing, 'Case')

  return dbCall(async (prisma) => {
    return prisma.case.delete({
      where: { id },
    })
  })
}

/**
 * Get recent cases (last 30 days)
 */
export async function getRecentCases(days: number = 30) {
  return dbCall(async (prisma) => {
    return prisma.case.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })
  }).catch(() => [])
}

/**
 * Get case by ID with competencies
 */
export async function getCaseByIdWithCompetencies(id: string) {
  return dbCall(async (prisma) => {
    return prisma.case.findUnique({
      where: { id },
      include: {
        competencies: {
          include: {
            competency: true,
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
 * Get cases with prerequisites
 */
export async function getCasesWithPrerequisites() {
  return dbCall(async (prisma) => {
    return prisma.case.findMany({
      where: {
        prerequisites: {
          not: null,
        },
      },
      include: {
        competencies: {
          include: {
            competency: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })
  }).catch(() => [])
}

/**
 * Bulk update case statuses
 */
export async function bulkUpdateCaseStatuses(
  caseIds: string[],
  status: string,
  updatedBy: string
) {
  return dbCall(async (prisma) => {
    return prisma.case.updateMany({
      where: {
        id: { in: caseIds },
      },
      data: {
        status,
        updatedBy,
      },
    })
  })
}

