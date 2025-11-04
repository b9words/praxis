/**
 * Progress repository
 * All progress tracking database operations go through here
 */

import { dbCall, AppError, isColumnNotFoundError } from './utils'
import { ensureProfileExists } from './profiles'
import type { Prisma } from '@prisma/client'

export interface LessonProgress {
  id: string
  user_id: string
  domain_id: string
  module_id: string
  lesson_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  time_spent_seconds: number
  last_read_position: Record<string, any>
  completed_at: string | null
  bookmarked: boolean
  created_at: string
  updated_at: string
}

export interface ProgressUpdateData {
  status?: 'not_started' | 'in_progress' | 'completed'
  progress_percentage?: number
  time_spent_seconds?: number
  last_read_position?: Record<string, any>
  completed_at?: string | null
  bookmarked?: boolean
}

export interface DomainProgress {
  domainId: string
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  notStartedLessons: number
  completionPercentage: number
  totalTimeSpentSeconds: number
}

/**
 * Get lesson progress for a specific user and lesson
 */
export async function getLessonProgress(
  userId: string,
  domainId: string,
  moduleId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  return dbCall(async (prisma) => {
    const progress = await prisma.userLessonProgress.findUnique({
      where: {
        userId_domainId_moduleId_lessonId: {
          userId,
          domainId,
          moduleId,
          lessonId,
        },
      },
    })

    if (!progress) {
      return null
    }

    return {
      id: progress.id,
      user_id: progress.userId,
      domain_id: progress.domainId,
      module_id: progress.moduleId,
      lesson_id: progress.lessonId,
      status: progress.status as 'not_started' | 'in_progress' | 'completed',
      progress_percentage: progress.progressPercentage,
      time_spent_seconds: progress.timeSpentSeconds,
      last_read_position: progress.lastReadPosition as Record<string, any>,
      completed_at: progress.completedAt?.toISOString() || null,
      bookmarked: progress.bookmarked,
      created_at: progress.createdAt.toISOString(),
      updated_at: progress.updatedAt.toISOString(),
    }
  }).catch((error: any) => {
    // If column doesn't exist (P2022), return null gracefully
    if (isColumnNotFoundError(error)) {
      return null
    }
    throw error
  })
}

/**
 * Update or create lesson progress
 */
export async function upsertLessonProgress(
  userId: string,
  domainId: string,
  moduleId: string,
  lessonId: string,
  data: ProgressUpdateData
): Promise<LessonProgress | null> {
  // Ensure profile exists before attempting to create progress
  const profileExists = await ensureProfileExists(userId)
  if (!profileExists) {
    return null
  }

  return dbCall(async (prisma) => {
    const progress = await prisma.userLessonProgress.upsert({
      where: {
        userId_domainId_moduleId_lessonId: {
          userId,
          domainId,
          moduleId,
          lessonId,
        },
      },
      update: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.progress_percentage !== undefined && { progressPercentage: data.progress_percentage }),
        ...(data.time_spent_seconds !== undefined && { timeSpentSeconds: data.time_spent_seconds }),
        ...(data.last_read_position !== undefined && { lastReadPosition: data.last_read_position as any }),
        ...(data.completed_at !== undefined && {
          completedAt: data.completed_at ? new Date(data.completed_at) : null,
        }),
        ...(data.bookmarked !== undefined && { bookmarked: data.bookmarked }),
      },
      create: {
        userId,
        domainId,
        moduleId,
        lessonId,
        status: data.status || 'in_progress',
        progressPercentage: data.progress_percentage || 0,
        timeSpentSeconds: data.time_spent_seconds || 0,
        lastReadPosition: (data.last_read_position || {}) as any,
        completedAt: data.completed_at ? new Date(data.completed_at) : null,
        bookmarked: data.bookmarked || false,
      },
    })

    return {
      id: progress.id,
      user_id: progress.userId,
      domain_id: progress.domainId,
      module_id: progress.moduleId,
      lesson_id: progress.lessonId,
      status: progress.status as 'not_started' | 'in_progress' | 'completed',
      progress_percentage: progress.progressPercentage,
      time_spent_seconds: progress.timeSpentSeconds,
      last_read_position: progress.lastReadPosition as Record<string, any>,
      completed_at: progress.completedAt?.toISOString() || null,
      bookmarked: progress.bookmarked,
      created_at: progress.createdAt.toISOString(),
      updated_at: progress.updatedAt.toISOString(),
    }
  })
}

/**
 * Get all progress for a user
 */
export async function getAllUserProgress(userId: string): Promise<Map<string, LessonProgress>> {
  return dbCall(async (prisma) => {
    const progressItems = await prisma.userLessonProgress.findMany({
      where: { userId },
    })

    const progressMap = new Map<string, LessonProgress>()
    progressItems.forEach((progress) => {
      const key = `${progress.domainId}:${progress.moduleId}:${progress.lessonId}`
      progressMap.set(key, {
        id: progress.id,
        user_id: progress.userId,
        domain_id: progress.domainId,
        module_id: progress.moduleId,
        lesson_id: progress.lessonId,
        status: progress.status as 'not_started' | 'in_progress' | 'completed',
        progress_percentage: progress.progressPercentage,
        time_spent_seconds: progress.timeSpentSeconds,
        last_read_position: progress.lastReadPosition as Record<string, any>,
        completed_at: progress.completedAt?.toISOString() || null,
        bookmarked: progress.bookmarked,
        created_at: progress.createdAt.toISOString(),
        updated_at: progress.updatedAt.toISOString(),
      })
    })

    return progressMap
  }).catch(() => new Map()) // Return empty map on error
}

/**
 * Get lesson progress list for recommendation engine
 */
export async function getLessonProgressList(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        domainId: true,
        moduleId: true,
        lessonId: true,
        status: true,
        completedAt: true,
        updatedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    })
  }).catch(() => [])
}

/**
 * Get in-progress lessons for dashboard
 */
export async function getInProgressLessonsForDashboard(userId: string, limit: number = 5) {
  return dbCall(async (prisma) => {
    return prisma.userLessonProgress.findMany({
      where: { userId, status: { in: ['in_progress'] } },
      select: {
        domainId: true,
        moduleId: true,
        lessonId: true,
        progressPercentage: true,
        lastReadPosition: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })
  }).catch(() => [])
}

/**
 * Get lesson progress summary for dashboard
 */
export async function getLessonProgressSummary(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.userLessonProgress.findMany({
      where: { userId },
      select: { domainId: true, moduleId: true, lessonId: true, status: true },
    })
  }).catch(() => [])
}

/**
 * Get popular lessons (group by domain, module, lesson)
 */
export async function getPopularLessons(limit: number = 6) {
  return dbCall(async (prisma) => {
    return prisma.userLessonProgress.groupBy({
      by: ['domainId', 'moduleId', 'lessonId'],
      where: { status: 'completed' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    })
  }).catch(() => [])
}

/**
 * Get aggregate progress for a domain
 */
export async function getDomainProgress(
  userId: string,
  domainId: string,
  totalLessonsInDomain: number
): Promise<DomainProgress> {
  return dbCall(async (prisma) => {
    const progressItems = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        domainId,
      },
      select: {
        status: true,
        timeSpentSeconds: true,
      },
    })

    const completedLessons = progressItems.filter((p) => p.status === 'completed').length
    const inProgressLessons = progressItems.filter((p) => p.status === 'in_progress').length
    const notStartedLessons = Math.max(0, totalLessonsInDomain - progressItems.length)
    const totalTimeSpentSeconds = progressItems.reduce((sum, p) => sum + p.timeSpentSeconds, 0)

    return {
      domainId,
      totalLessons: totalLessonsInDomain,
      completedLessons,
      inProgressLessons,
      notStartedLessons,
      completionPercentage:
        totalLessonsInDomain > 0 ? Math.round((completedLessons / totalLessonsInDomain) * 100) : 0,
      totalTimeSpentSeconds,
    }
  }).catch(() => ({
    domainId,
    totalLessons: totalLessonsInDomain,
    completedLessons: 0,
    inProgressLessons: 0,
    notStartedLessons: totalLessonsInDomain,
    completionPercentage: 0,
    totalTimeSpentSeconds: 0,
  }))
}

/**
 * Check if a domain is completed (all lessons and cases)
 */
export async function checkDomainCompletion(
  userId: string,
  domainId: string
): Promise<{ id: string; userId: string; domainId: string; completedAt: Date } | null> {
  return dbCall(async (prisma) => {
    const { getAllLessonsFlat } = await import('../curriculum-data')
    const { getAllInteractiveSimulations } = await import('../case-study-loader')
    const { getEnhancedCurriculum } = await import('../enhanced-curriculum-integration')

    const allLessons = getAllLessonsFlat()
    const allSimulations = getAllInteractiveSimulations()
    const enhancedCurriculum = getEnhancedCurriculum()
    
    const domain = enhancedCurriculum.find(d => d.domainId === domainId)
    if (!domain) {
      return null
    }

    const domainLessons = allLessons.filter(l => l.domain === domainId)
    const domainSimulations = domain.learningPath.filter(item => item.type === 'simulation')

    // Check if all lessons are completed
    const lessonProgress = await prisma.userLessonProgress.findMany({
      where: {
        userId,
        domainId,
        status: 'completed',
      },
    })

    const completedLessonIds = new Set(
      lessonProgress.map(p => `${p.domainId}-${p.moduleId}-${p.lessonId}`)
    )
    const requiredLessonIds = new Set(
      domainLessons.map(l => `${l.domain}-${l.moduleId}-${l.lessonId}`)
    )

    const allLessonsCompleted = requiredLessonIds.size > 0 && 
      Array.from(requiredLessonIds).every(id => completedLessonIds.has(id))

    // Check if all simulations are completed
    let allSimulationsCompleted = true
    if (domainSimulations.length > 0) {
      const simulationIds = domainSimulations.map(s => s.simulationId || s.lesson)
      const completedSimulations = await prisma.simulation.findMany({
        where: {
          userId,
          status: 'completed',
          caseId: { in: simulationIds },
        },
        select: { caseId: true },
      })

      const completedCaseIds = new Set(completedSimulations.map(s => s.caseId))
      allSimulationsCompleted = simulationIds.every(id => completedCaseIds.has(id))
    }

    // Domain is completed if all lessons and simulations are done
    if (allLessonsCompleted && allSimulationsCompleted) {
      const completion = await prisma.domainCompletion.upsert({
        where: {
          userId_domainId: {
            userId,
            domainId,
          },
        },
        update: {
          completedAt: new Date(),
        },
        create: {
          userId,
          domainId,
          completedAt: new Date(),
        },
      })

      return {
        id: completion.id,
        userId: completion.userId,
        domainId: completion.domainId,
        completedAt: completion.completedAt,
      }
    }

    return null
  }).catch(() => null)
}

/**
 * Get all domain completions for a user
 */
export async function getUserDomainCompletions(userId: string) {
  return dbCall(async (prisma) => {
    return prisma.domainCompletion.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    })
  }).catch(() => [])
}

/**
 * Get domain completion by user and domain
 */
export async function getDomainCompletion(userId: string, domainId: string) {
  return dbCall(async (prisma) => {
    return prisma.domainCompletion.findUnique({
      where: {
        userId_domainId: {
          userId,
          domainId,
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
 * Get user reading statistics
 */
export interface UserReadingStats {
  totalLessonsCompleted: number
  totalTimeSpentSeconds: number
  totalBookmarks: number
  lessonsInProgress: number
  averageTimePerLesson: number
}

export async function getUserReadingStats(userId: string): Promise<UserReadingStats> {
  return dbCall(async (prisma) => {
    const progressItems = await prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        status: true,
        timeSpentSeconds: true,
        bookmarked: true,
      },
    })

    const totalLessonsCompleted = progressItems.filter((p) => p.status === 'completed').length
    const lessonsInProgress = progressItems.filter((p) => p.status === 'in_progress').length
    const totalTimeSpentSeconds = progressItems.reduce((sum, p) => sum + p.timeSpentSeconds, 0)
    const totalBookmarks = progressItems.filter((p) => p.bookmarked).length
    const averageTimePerLesson =
      totalLessonsCompleted > 0 ? Math.round(totalTimeSpentSeconds / totalLessonsCompleted) : 0

    return {
      totalLessonsCompleted,
      totalTimeSpentSeconds,
      totalBookmarks,
      lessonsInProgress,
      averageTimePerLesson,
    }
  }).catch(() => ({
    totalLessonsCompleted: 0,
    totalTimeSpentSeconds: 0,
    totalBookmarks: 0,
    lessonsInProgress: 0,
    averageTimePerLesson: 0,
  }))
}

/**
 * Toggle bookmark status for a lesson
 */
export async function bookmarkLesson(
  userId: string,
  domainId: string,
  moduleId: string,
  lessonId: string,
  bookmarked: boolean
): Promise<boolean> {
  const progress = await upsertLessonProgress(userId, domainId, moduleId, lessonId, { bookmarked })
  return progress !== null
}

/**
 * Mark a lesson as completed
 */
export async function markLessonCompleted(
  userId: string,
  domainId: string,
  moduleId: string,
  lessonId: string
): Promise<boolean> {
  const progress = await upsertLessonProgress(userId, domainId, moduleId, lessonId, {
    status: 'completed',
    progress_percentage: 100,
    completed_at: new Date().toISOString(),
  })
  return progress !== null
}

