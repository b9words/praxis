import type { LessonProgressStatus } from '@prisma/client'
import { prisma } from './prisma/server'

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
  status?: LessonProgressStatus
  progress_percentage?: number
  time_spent_seconds?: number
  last_read_position?: Record<string, any>
  completed_at?: string | null
  bookmarked?: boolean
}

export interface UserReadingStats {
  totalLessonsCompleted: number
  totalTimeSpentSeconds: number
  totalBookmarks: number
  lessonsInProgress: number
  averageTimePerLesson: number
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
    status: progress.status,
    progress_percentage: progress.progressPercentage,
    time_spent_seconds: progress.timeSpentSeconds,
    last_read_position: progress.lastReadPosition as Record<string, any>,
    completed_at: progress.completedAt?.toISOString() || null,
    bookmarked: progress.bookmarked,
    created_at: progress.createdAt.toISOString(),
    updated_at: progress.updatedAt.toISOString(),
  }
}

/**
 * Update or create lesson progress
 */
export async function updateLessonProgress(
  userId: string,
  domainId: string,
  moduleId: string,
  lessonId: string,
  data: ProgressUpdateData
): Promise<LessonProgress | null> {
  try {
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
        status: data.status,
        progressPercentage: data.progress_percentage,
        timeSpentSeconds: data.time_spent_seconds,
        lastReadPosition: data.last_read_position as any,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        bookmarked: data.bookmarked,
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
      status: progress.status,
      progress_percentage: progress.progressPercentage,
      time_spent_seconds: progress.timeSpentSeconds,
      last_read_position: progress.lastReadPosition as Record<string, any>,
      completed_at: progress.completedAt?.toISOString() || null,
      bookmarked: progress.bookmarked,
      created_at: progress.createdAt.toISOString(),
      updated_at: progress.updatedAt.toISOString(),
    }
  } catch (error) {
    console.error('Error updating lesson progress:', error)
    return null
  }
}

/**
 * Get all progress for a user
 */
export async function getAllUserProgress(userId: string): Promise<Map<string, LessonProgress>> {
  const progressItems = await prisma.userLessonProgress.findMany({
    where: { userId },
  })

  // Create a map keyed by "domain:module:lesson"
  const progressMap = new Map<string, LessonProgress>()
  progressItems.forEach((progress) => {
    const key = `${progress.domainId}:${progress.moduleId}:${progress.lessonId}`
    progressMap.set(key, {
      id: progress.id,
      user_id: progress.userId,
      domain_id: progress.domainId,
      module_id: progress.moduleId,
      lesson_id: progress.lessonId,
      status: progress.status,
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
}

/**
 * Get aggregate progress for a domain
 */
export async function getDomainProgress(
  userId: string,
  domainId: string,
  totalLessonsInDomain: number
): Promise<DomainProgress> {
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
}

/**
 * Get user reading statistics
 */
export async function getUserReadingStats(userId: string): Promise<UserReadingStats> {
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
  const progress = await updateLessonProgress(userId, domainId, moduleId, lessonId, { bookmarked })
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
  const progress = await updateLessonProgress(userId, domainId, moduleId, lessonId, {
    status: 'completed',
    progress_percentage: 100,
    completed_at: new Date().toISOString(),
  })
  return progress !== null
}
