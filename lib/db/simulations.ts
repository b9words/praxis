/**
 * Simulations repository
 * All simulation database operations go through here
 */

import type { Prisma } from '@prisma/client'
import { assertFound, dbCall, isColumnNotFoundError } from './utils'

export interface SimulationFilters {
  userId?: string
  caseId?: string
  status?: string
}

const defaultInclude = {
  case: {
    select: {
      id: true,
      title: true,
    },
  },
  debrief: {
    select: {
      id: true,
      scores: true,
      summaryText: true,
      radarChartData: true,
    },
  },
} as const

/**
 * List simulations with optional filters
 */
export async function listSimulations(filters: SimulationFilters = {}) {
  const where: Prisma.SimulationWhereInput = {}
  
  if (filters.userId) {
    where.userId = filters.userId
  }
  
  if (filters.caseId) {
    where.caseId = filters.caseId
  }
  
  if (filters.status) {
    where.status = filters.status
  }

  return dbCall(async (prisma) => {
    return prisma.simulation.findMany({
      where,
      include: defaultInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
}

/**
 * Get simulation by ID
 */
export async function getSimulationById(id: string) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findUnique({
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
 * Get simulation by user and case
 */
export async function getSimulationByUserAndCase(userId: string, caseId: string) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findFirst({
      where: {
        userId,
        caseId,
      },
      include: defaultInclude,
    })
  })
}

/**
 * Get completed simulation by user and case
 */
export async function getCompletedSimulationByUserAndCase(userId: string, caseId: string) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findFirst({
      where: {
        userId,
        caseId,
        status: 'completed',
      },
      include: defaultInclude,
    })
  })
}

/**
 * Create a new simulation
 */
export async function createSimulation(data: {
  userId: string
  caseId: string
  userInputs?: any
  status?: string
}) {
  // Check if simulation already exists
  const existing = await getSimulationByUserAndCase(data.userId, data.caseId)
  if (existing) {
    return existing
  }

  return dbCall(async (prisma) => {
    // Verify user exists before creating simulation (userId is required, cannot be null)
    if (data.userId && data.userId.trim()) {
      try {
        const userExists = await prisma.profile.findUnique({
          where: { id: data.userId },
          select: { id: true },
        })
        if (!userExists) {
          console.warn(`[createSimulation] User ${data.userId} not found, simulation creation will fail with FK error`)
          // Note: We don't set userId to null because simulations MUST have a valid user
          // This will cause a foreign key constraint error, which is the correct behavior
        }
      } catch (err) {
        console.warn('[createSimulation] Failed to verify user:', err)
        // Continue - FK constraint will catch invalid user
      }
    }
    
    return prisma.simulation.create({
      data: {
        userId: data.userId,
        caseId: data.caseId,
        userInputs: data.userInputs || {},
        status: data.status || 'in_progress',
      },
      include: defaultInclude,
    })
  })
}

/**
 * Update simulation status
 */
export async function updateSimulationStatus(
  id: string,
  status: string,
  userInputs?: any
) {
  const existing = await getSimulationById(id)
  assertFound(existing, 'Simulation')

  const updateData: Prisma.SimulationUpdateInput = {
    status,
    ...(status === 'completed' && { completedAt: new Date() }),
  }

  if (userInputs !== undefined) {
    updateData.userInputs = userInputs
  }

  return dbCall(async (prisma) => {
    return prisma.simulation.update({
      where: { id },
      data: updateData,
      include: defaultInclude,
    })
  })
}

/**
 * Get completed simulations for a user
 */
export async function getCompletedSimulations(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: {
        caseId: true,
      },
    })
  })
}

/**
 * Check if user owns simulation
 */
export async function verifySimulationOwnership(simulationId: string, userId: string): Promise<boolean> {
  return dbCall(async (prisma) => {
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      select: { userId: true },
    })
    return simulation?.userId === userId
  }).catch(() => false)
}

/**
 * Get recent simulations for a user (updated within specified time)
 */
export async function getRecentSimulations(userId: string, since: Date) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findMany({
      where: {
        userId,
        updatedAt: {
          gte: since,
        },
      },
      select: {
        caseId: true,
        case: {
          select: {
            title: true,
          },
        },
      },
    })
  })
}

/**
 * Get completed simulations for dashboard
 */
export async function getCompletedSimulationsForDashboard(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findMany({
      where: { userId, status: 'completed' },
      select: { id: true, completedAt: true },
    })
  }).catch(() => [])
}

/**
 * Get in-progress simulations for dashboard
 */
export async function getInProgressSimulationsForDashboard(userId: string, limit: number = 5) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findMany({
      where: { userId, status: 'in_progress' },
      include: { case: { select: { id: true, title: true } } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })
  }).catch(() => [])
}

/**
 * Get all simulations for dashboard (recent)
 */
export async function getAllSimulationsForDashboard(userId: string, limit: number = 3) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findMany({
      where: { userId },
      include: { case: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }).catch(() => [])
}

/**
 * Get completed simulations by case IDs
 */
export async function getCompletedSimulationsByCaseIds(userId: string, caseIds: string[]) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findMany({
      where: {
        userId,
        caseId: { in: caseIds },
        status: 'completed',
      },
      select: { caseId: true },
    })
  }).catch(() => [])
}

/**
 * Get popular simulations (group by caseId)
 */
export async function getPopularSimulations(limit: number = 3) {
  return dbCall(async (prisma) => {
    return prisma.simulation.groupBy({
      by: ['caseId'],
      where: { status: 'completed' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    })
  }).catch(() => [])
}

/**
 * Count completed simulations for a user
 */
export async function countCompletedSimulations(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.simulation.count({
      where: {
        userId,
        status: 'completed',
      },
    })
  }).catch(() => 0)
}

/**
 * Get simulation by ID with full includes
 */
export async function getSimulationByIdFull(id: string) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findUnique({
      where: { id },
      include: {
        case: true,
        debrief: true,
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
 * Update simulation (partial update)
 */
export async function updateSimulation(id: string, data: Record<string, any>) {
  return dbCall(async (prisma) => {
    return prisma.simulation.update({
      where: { id },
      data,
      include: {
        case: {
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
 * Get simulation state (userId and userInputs only)
 */
export async function getSimulationState(id: string) {
  return dbCall(async (prisma) => {
    return prisma.simulation.findUnique({
      where: { id },
      select: { userId: true, userInputs: true },
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
 * Update simulation state (userInputs)
 */
export async function updateSimulationState(
  id: string,
  state: {
    stageStates?: any
    currentStageId?: string | null
    eventLog?: any[]
  }
) {
  return dbCall(async (prisma) => {
    return prisma.simulation.update({
      where: { id },
      data: {
        userInputs: {
          stageStates: state.stageStates || {},
          currentStageId: state.currentStageId || null,
          eventLog: state.eventLog || [],
          lastSaved: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    })
  })
}

