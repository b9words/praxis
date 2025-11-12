/**
 * Cases repository
 * All case database operations go through here
 */

import { dbCall, withTransaction, assertFound, isColumnNotFoundError } from './utils'
import type { Prisma } from '@prisma/client'
import { isYear1CaseStudy } from '../year1-allowlist'

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
  published?: boolean
  difficulty?: string | null
  estimatedMinutes?: number | null
  prerequisites?: any
  storagePath?: string | null
  metadata?: Record<string, any>
  competencyIds?: string[]
  createdBy: string | null
  updatedBy: string | null
}

export interface UpdateCaseData {
  title?: string
  briefingDoc?: string | null
  description?: string | null
  datasets?: any
  rubric?: any
  status?: string
  published?: boolean
  difficulty?: string | null
  estimatedMinutes?: number | null
  prerequisites?: any
  storagePath?: string | null
  metadata?: Record<string, any>
  competencyIds?: string[]
  updatedBy?: string
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

  // For public queries, only show published content unless status is explicitly set
  if (!filters.status) {
    where.published = true
  }

  return dbCall(async (prisma) => {
    const cases = await prisma.case.findMany({
      where,
      include: defaultInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    // Filter to Year 1 content only
    return cases.filter(caseItem => {
      // Check both database ID and metadata.caseId
      const caseId = (caseItem.metadata as any)?.caseId || caseItem.id
      return isYear1CaseStudy(caseId)
    })
  })
}

/**
 * Get case by ID (supports both database ID and metadata.caseId)
 */
export async function getCaseById(id: string) {
  return dbCall(async (prisma) => {
    // First try to find by database ID
    let caseItem = await prisma.case.findUnique({
      where: { id },
      include: defaultInclude,
    })
    
    // If not found by ID, try to find by caseId in metadata
    if (!caseItem) {
      const cases = await prisma.case.findMany({
        where: {
          published: true,
        },
        include: defaultInclude,
        take: 100, // Limit to avoid performance issues
      })
      
      // Search for case with matching caseId in metadata
      caseItem = cases.find((c) => {
        const metadata = c.metadata as any
        return metadata?.caseId === id || c.id === id
      }) || null
    }
    
    return caseItem
  }).catch((error: any) => {
    // If column doesn't exist (P2022), return null gracefully
    if (isColumnNotFoundError(error)) {
      return null
    }
    throw error
  })
}

/**
 * Create a case with its files in a single atomic transaction
 * This ensures that either both the case and files are saved, or neither are saved
 */
export async function createCaseWithFiles(
  data: CreateCaseData,
  files: CaseFileInput[]
) {
  return withTransaction(async (tx) => {
    // Handle user FK references - set to null if empty string or invalid
    const createdBy = data.createdBy && data.createdBy.trim() ? data.createdBy : null
    const updatedBy = data.updatedBy && data.updatedBy.trim() ? data.updatedBy : null
    
    // If user IDs provided, verify they exist before creating
    if (createdBy) {
      try {
        const userExists = await tx.profile.findUnique({
          where: { id: createdBy },
          select: { id: true },
        })
        if (!userExists) {
          console.warn(`[createCaseWithFiles] User ${createdBy} not found, setting createdBy/updatedBy to null`)
          // Continue with null values
        } else {
          // User exists, keep the IDs
        }
      } catch (err) {
        console.warn('[createCaseWithFiles] Failed to verify user, setting createdBy/updatedBy to null:', err)
        // Continue with null values
      }
    }
    
    // Duplicate prevention: Check if case with same blueprintId already exists
    const metadata = data.metadata || {}
    const blueprintId = metadata.blueprintId
    if (blueprintId && typeof blueprintId === 'string') {
      const existingCase = await tx.case.findFirst({
        where: {
          metadata: {
            path: ['blueprintId'],
            equals: blueprintId,
          },
        },
        select: { id: true, title: true },
      })
      if (existingCase) {
        throw new Error(`Case with blueprint ID "${blueprintId}" already exists (Case: ${existingCase.title})`)
      }
    }
    
    // Competency validation: Verify all competency IDs exist before creating relationships
    let verifiedCompetencyIds: string[] = []
    if (data.competencyIds && data.competencyIds.length > 0) {
      const validCompetencyIds = data.competencyIds.filter((id): id is string => 
        typeof id === 'string' && id.length > 0
      )
      
      if (validCompetencyIds.length > 0) {
        try {
          const existingCompetencies = await tx.competency.findMany({
            where: { id: { in: validCompetencyIds } },
            select: { id: true },
          })
          verifiedCompetencyIds = existingCompetencies.map(c => c.id)
          if (verifiedCompetencyIds.length < validCompetencyIds.length) {
            const missing = validCompetencyIds.filter(id => !verifiedCompetencyIds.includes(id))
            console.warn(`[createCaseWithFiles] Skipping ${missing.length} invalid competency IDs:`, missing)
          }
        } catch (error) {
          // If competency table doesn't exist or query fails, skip competencies
          console.warn('[createCaseWithFiles] Failed to verify competencies, skipping relationships:', error)
          verifiedCompetencyIds = []
        }
      }
    }
    
    // Create the case first
    const createdCase = await tx.case.create({
      data: {
        title: data.title,
        briefingDoc: data.briefingDoc ?? null,
        description: data.description ?? null,
        datasets: data.datasets ?? null,
        rubric: data.rubric,
        status: data.status ?? 'draft',
        published: data.published ?? false,
        difficulty: data.difficulty ?? null,
        estimatedMinutes: data.estimatedMinutes ?? null,
        prerequisites: data.prerequisites ?? [],
        storagePath: data.storagePath ?? null,
        metadata: data.metadata ?? {},
        createdBy: createdBy || null,
        updatedBy: updatedBy || null,
        competencies: verifiedCompetencyIds.length > 0
          ? {
              create: verifiedCompetencyIds.map((compId) => ({
                competencyId: compId,
              })),
            }
          : undefined,
      },
      include: defaultInclude,
    })

    // Then create all files in the same transaction
    // Note: If caseFile model doesn't exist, this will fail and rollback the entire transaction
    const createdFiles = []
    if (files && Array.isArray(files) && files.length > 0) {
      // Check if caseFile model is available in transaction client
      if (!tx.caseFile) {
        throw new Error('caseFile model not available in Prisma client. Please run: npx prisma generate')
      }
      
      for (const file of files) {
        // Skip invalid files
        if (!file || !file.fileId || !file.fileName) {
          console.warn('[createCaseWithFiles] Skipping invalid file:', file)
          continue
        }
        
        // Ensure file.caseId matches the created case
        const fileWithCaseId = {
          ...file,
          caseId: createdCase.id,
        }
        
        try {
          const createdFile = await tx.caseFile.upsert({
            where: {
              caseId_fileId: {
                caseId: fileWithCaseId.caseId,
                fileId: fileWithCaseId.fileId,
              },
            },
            create: {
              caseId: fileWithCaseId.caseId,
              fileId: fileWithCaseId.fileId,
              fileName: fileWithCaseId.fileName,
              fileType: fileWithCaseId.fileType || 'UNKNOWN',
              mimeType: fileWithCaseId.mimeType || 'text/markdown',
              content: fileWithCaseId.content || null,
              size: fileWithCaseId.size || (fileWithCaseId.content ? fileWithCaseId.content.length : null),
            },
            update: {
              fileName: fileWithCaseId.fileName,
              fileType: fileWithCaseId.fileType || 'UNKNOWN',
              mimeType: fileWithCaseId.mimeType || 'text/markdown',
              content: fileWithCaseId.content !== undefined ? fileWithCaseId.content : undefined,
              size: fileWithCaseId.size !== undefined ? fileWithCaseId.size : (fileWithCaseId.content ? fileWithCaseId.content.length : null),
            },
          })
          createdFiles.push(createdFile)
        } catch (fileError: any) {
          // If it's a table missing error, provide helpful message
          if (fileError.code === 'P2021' || fileError.message?.includes('Table does not exist')) {
            throw new Error('case_files table does not exist. Please run: npm run db:push')
          }
          // Re-throw other errors to trigger transaction rollback
          throw fileError
        }
      }
    }

    return {
      case: createdCase,
      files: createdFiles,
    }
  })
}

/**
 * Create a new case
 */
export async function createCase(data: CreateCaseData) {
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
          console.warn(`[createCase] User ${createdBy} not found, setting createdBy/updatedBy to null`)
          return prisma.case.create({
            data: {
              title: data.title,
              briefingDoc: data.briefingDoc ?? null,
              description: data.description ?? null,
              datasets: data.datasets ?? null,
              rubric: data.rubric,
              status: data.status ?? 'draft',
              published: data.published ?? false,
              difficulty: data.difficulty ?? null,
              estimatedMinutes: data.estimatedMinutes ?? null,
              prerequisites: data.prerequisites ?? [],
              storagePath: data.storagePath ?? null,
              metadata: data.metadata ?? {},
              createdBy: null,
              updatedBy: null,
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
        }
      } catch (err) {
        console.warn('[createCase] Failed to verify user, setting createdBy/updatedBy to null:', err)
        // Fall through to create with null
      }
    }
    
    return prisma.case.create({
      data: {
        title: data.title,
        briefingDoc: data.briefingDoc ?? null,
        description: data.description ?? null,
        datasets: data.datasets ?? null,
        rubric: data.rubric,
        status: data.status ?? 'draft',
        published: data.published ?? false,
        difficulty: data.difficulty ?? null,
        estimatedMinutes: data.estimatedMinutes ?? null,
        prerequisites: data.prerequisites ?? [],
        storagePath: data.storagePath ?? null,
        metadata: data.metadata ?? {},
        createdBy,
        updatedBy,
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
      // Filter out any invalid competency IDs
      const validCompetencyIds = (caseData.competencyIds || []).filter((id): id is string => 
        typeof id === 'string' && id.length > 0
      )
      
      // Verify competency IDs actually exist in database (avoid FK constraint violations)
      let verifiedCompetencyIds: string[] = []
      if (validCompetencyIds.length > 0) {
        try {
          const existingCompetencies = await tx.competency.findMany({
            where: { id: { in: validCompetencyIds } },
            select: { id: true },
          })
          verifiedCompetencyIds = existingCompetencies.map(c => c.id)
          if (verifiedCompetencyIds.length < validCompetencyIds.length) {
            const missing = validCompetencyIds.filter(id => !verifiedCompetencyIds.includes(id))
            console.warn(`[bulkCreateCases] Skipping ${missing.length} invalid competency IDs:`, missing)
          }
        } catch (error) {
          // If competency table doesn't exist or query fails, just skip competencies
          console.warn('[bulkCreateCases] Failed to verify competencies, skipping relationships:', error)
          verifiedCompetencyIds = []
        }
      }
      
      // If no verified competencies, ensure we don't try to create relationships
      if (verifiedCompetencyIds.length === 0) {
        console.log(`[bulkCreateCases] Case "${caseData.title}" will be saved without competency relationships`)
      }
      
      // Verify user exists (avoid FK constraint on createdBy/updatedBy)
      let verifiedUserId: string | null = userId
      try {
        const userExists = await tx.profile.findUnique({
          where: { id: userId },
          select: { id: true },
        })
        if (!userExists) {
          console.warn(`[bulkCreateCases] User ${userId} not found, setting createdBy/updatedBy to null`)
          verifiedUserId = null
        }
      } catch (error) {
        // If profile table doesn't exist or query fails, set to null
        console.warn('[bulkCreateCases] Failed to verify user, setting createdBy/updatedBy to null:', error)
        verifiedUserId = null
      }
      
      // Create case - only add competencies if we have verified IDs
      const caseCreateData: any = {
        title: caseData.title,
        briefingDoc: caseData.briefingDoc ?? null,
        description: caseData.description ?? null,
        datasets: caseData.datasets ?? null,
        rubric: caseData.rubric,
        status: caseData.status ?? 'draft',
        published: caseData.published ?? false,
        difficulty: caseData.difficulty ?? null,
        estimatedMinutes: caseData.estimatedMinutes ?? null,
        prerequisites: caseData.prerequisites ?? [],
        storagePath: caseData.storagePath ?? null,
        metadata: caseData.metadata ?? {},
        createdBy: verifiedUserId,
        updatedBy: verifiedUserId,
      }
      
      // Only add competencies relationship if we have verified IDs
      if (verifiedCompetencyIds.length > 0) {
        caseCreateData.competencies = {
          create: verifiedCompetencyIds.map((compId) => ({
            competencyId: compId,
          })),
        }
      }
      
      try {
        const created = await tx.case.create({
          data: caseCreateData,
          include: defaultInclude,
        })
        
        createdCases.push(created)
      } catch (createError: any) {
        // If FK constraint violation, try again without competencies and without user references
        if (createError.code === 'P2003' || createError.message?.includes('Foreign key constraint')) {
          console.warn(`[bulkCreateCases] FK violation for case "${caseData.title}", retrying without optional relationships:`, createError.message)
          
          // Retry with minimal data - no competencies, no user references
          const minimalData: any = {
            title: caseData.title,
            briefingDoc: caseData.briefingDoc ?? null,
            description: caseData.description ?? null,
            datasets: caseData.datasets ?? null,
            rubric: caseData.rubric,
            status: caseData.status ?? 'draft',
            published: caseData.published ?? false,
            difficulty: caseData.difficulty ?? null,
            estimatedMinutes: caseData.estimatedMinutes ?? null,
            prerequisites: caseData.prerequisites ?? [],
            storagePath: caseData.storagePath ?? null,
            metadata: caseData.metadata ?? {},
            // Set createdBy/updatedBy to null to avoid FK constraint
            createdBy: null,
            updatedBy: null,
          }
          
          const created = await tx.case.create({
            data: minimalData,
            include: defaultInclude,
          })
          
          createdCases.push(created)
          console.log(`[bulkCreateCases] Case "${caseData.title}" saved successfully without relationships`)
        } else {
          // Re-throw if it's not an FK constraint error
          throw createError
        }
      }
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
    const updateData: Prisma.CaseUpdateInput = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.briefingDoc !== undefined) updateData.briefingDoc = data.briefingDoc
    if (data.description !== undefined) updateData.description = data.description
    if (data.datasets !== undefined) updateData.datasets = data.datasets
    if (data.rubric !== undefined) updateData.rubric = data.rubric
    if (data.status !== undefined) updateData.status = data.status
    if (data.published !== undefined) updateData.published = data.published
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
        published: true,
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
    // First try to find by database ID
    let caseItem = await prisma.case.findUnique({
      where: { id },
      include: {
        competencies: {
          include: {
            competency: true,
          },
        },
      },
    })
    
    // If not found by ID, try to find by caseId in metadata
    if (!caseItem) {
      const cases = await prisma.case.findMany({
        where: {
          published: true,
        },
        include: {
          competencies: {
            include: {
              competency: true,
            },
          },
        },
        take: 100, // Limit to avoid performance issues
      })
      
      // Search for case with matching caseId in metadata
      caseItem = cases.find((c) => {
        const metadata = c.metadata as any
        return metadata?.caseId === id || c.id === id
      }) || null
    }
    
    return caseItem
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
        } as any,
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
    // Verify user exists before bulk updating
    let verifiedUpdatedBy: string | null = updatedBy && updatedBy.trim() ? updatedBy : null
    
    if (verifiedUpdatedBy) {
      try {
        const userExists = await prisma.profile.findUnique({
          where: { id: verifiedUpdatedBy },
          select: { id: true },
        })
        if (!userExists) {
          console.warn(`[bulkUpdateCaseStatuses] User ${verifiedUpdatedBy} not found, setting updatedBy to null`)
          verifiedUpdatedBy = null
        }
      } catch (err) {
        console.warn('[bulkUpdateCaseStatuses] Failed to verify user, setting updatedBy to null:', err)
        verifiedUpdatedBy = null
      }
    }
    
    return prisma.case.updateMany({
      where: {
        id: { in: caseIds },
      },
      data: {
        status,
        updatedBy: verifiedUpdatedBy,
      },
    })
  })
}

// ============================================================================
// Case File Operations
// ============================================================================

export interface CaseFileInput {
  caseId: string
  fileId: string
  fileName: string
  fileType: string
  mimeType?: string
  content?: string | null
  size?: number | null
}

/**
 * List all files for a case
 */
export async function listCaseFiles(caseId: string) {
  return dbCall(async (prisma) => {
    return prisma.caseFile.findMany({
      where: { caseId },
      orderBy: { createdAt: 'asc' },
    })
  })
}

/**
 * Get a specific case file
 */
export async function getCaseFile(caseId: string, fileId: string) {
  return dbCall(async (prisma) => {
    return prisma.caseFile.findUnique({
      where: {
        caseId_fileId: {
          caseId,
          fileId,
        },
      },
    })
  })
}

/**
 * Upsert a case file (create or update)
 */
export async function upsertCaseFile(input: CaseFileInput) {
  return dbCall(async (prisma) => {
    return prisma.caseFile.upsert({
      where: {
        caseId_fileId: {
          caseId: input.caseId,
          fileId: input.fileId,
        },
      },
      create: {
        caseId: input.caseId,
        fileId: input.fileId,
        fileName: input.fileName,
        fileType: input.fileType,
        mimeType: input.mimeType || 'text/markdown',
        content: input.content || null,
        size: input.size || (input.content ? input.content.length : null),
      },
      update: {
        fileName: input.fileName,
        fileType: input.fileType,
        mimeType: input.mimeType || 'text/markdown',
        content: input.content !== undefined ? input.content : undefined,
        size: input.size !== undefined ? input.size : (input.content ? input.content.length : null),
      },
    })
  })
}

/**
 * Delete a case file
 */
export async function deleteCaseFile(caseId: string, fileId: string) {
  return dbCall(async (prisma) => {
    return prisma.caseFile.delete({
      where: {
        caseId_fileId: {
          caseId,
          fileId,
        },
      },
    })
  })
}

/**
 * Bulk upsert case files
 */
export async function bulkUpsertCaseFiles(files: CaseFileInput[]) {
  return dbCall(async (prisma) => {
    const results = []
    for (const file of files) {
      const result = await prisma.caseFile.upsert({
        where: {
          caseId_fileId: {
            caseId: file.caseId,
            fileId: file.fileId,
          },
        },
        create: {
          caseId: file.caseId,
          fileId: file.fileId,
          fileName: file.fileName,
          fileType: file.fileType,
          mimeType: file.mimeType || 'text/markdown',
          content: file.content || null,
          size: file.size || (file.content ? file.content.length : null),
        },
        update: {
          fileName: file.fileName,
          fileType: file.fileType,
          mimeType: file.mimeType || 'text/markdown',
          content: file.content !== undefined ? file.content : undefined,
          size: file.size !== undefined ? file.size : (file.content ? file.content.length : null),
        },
      })
      results.push(result)
    }
    return results
  })
}

