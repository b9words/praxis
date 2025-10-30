import type { LessonProgressStatus } from '@prisma/client'
import { isEnumError, isForeignKeyError, logErrorOnce } from './prisma-enum-fallback'
import { prisma } from './prisma/server'

// Track failed profile creation attempts to prevent repeated attempts
const failedProfileCreations = new Set<string>()
const PROFILE_RETRY_INTERVAL = 300000 // 5 minutes before retry

// Global circuit breaker for profile creation
const globalProfileFailures = new Map<string, number>()
const MAX_GLOBAL_FAILURES = 5
const GLOBAL_FAILURE_WINDOW = 60000 // 1 minute

/**
 * Ensure user profile exists before creating progress
 * Only creates if user exists in auth but missing profile
 */
async function ensureProfileExists(userId: string): Promise<boolean> {
  try {
    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    
    if (existingProfile) {
      return true // Profile exists
    }

    // Check if we've recently failed to create this user's profile
    if (failedProfileCreations.has(userId)) {
      return false // Don't retry immediately
    }

    // Check global failure rate to prevent system overload
    const now = Date.now()
    const recentFailures = Array.from(globalProfileFailures.entries())
      .filter(([timestamp]) => now - parseInt(timestamp) < GLOBAL_FAILURE_WINDOW)
      .length
    
    if (recentFailures >= MAX_GLOBAL_FAILURES) {
      return false // System-wide circuit breaker triggered
    }

    // Profile doesn't exist - validate user exists in auth.users first
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    // Use admin client to check if user actually exists in auth.users table
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Check if user exists in auth.users table
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (authError || !authUser?.user) {
      logErrorOnce(`Cannot create profile - user ${userId} does not exist in auth.users`, authError, 'warn')
      return false
    }

    // Get current user session for metadata
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    
    // Use auth user data (more reliable) or session data as fallback
    const userData = authUser.user
    const username = userData.user_metadata?.username || 
                    sessionUser?.user_metadata?.username || 
                    `user_${userId.slice(0, 8)}`
    const fullName = userData.user_metadata?.full_name || 
                    sessionUser?.user_metadata?.full_name || 
                    userData.email?.split('@')[0] || null
    const avatarUrl = userData.user_metadata?.avatar_url || 
                     sessionUser?.user_metadata?.avatar_url || null

    // Use raw SQL to create profile to avoid schema mismatch issues
    await prisma.$executeRawUnsafe(`
      INSERT INTO profiles (id, username, full_name, avatar_url, created_at, updated_at)
      VALUES ($1::uuid, $2::text, $3::text, $4::text, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, 
      userId,
      username,
      fullName,
      avatarUrl
    )
    
    return true // Profile created successfully
  } catch (error: any) {
    // Mark this user as failed and set retry timer
    failedProfileCreations.add(userId)
    setTimeout(() => failedProfileCreations.delete(userId), PROFILE_RETRY_INTERVAL)
    
    // Track global failures for circuit breaker
    const now = Date.now()
    globalProfileFailures.set(now.toString(), now)
    
    // Clean up old failure records
    setTimeout(() => {
      globalProfileFailures.delete(now.toString())
    }, GLOBAL_FAILURE_WINDOW)
    
    // Log the error but prevent repeated attempts (suppressed by logErrorOnce)
    logErrorOnce(`Failed to create profile for user ${userId}`, error, 'error')
    
    // Check if profile exists anyway (might have been created by race condition)
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true },
      })
      const exists = !!profile
      if (exists) {
        // Profile exists, clear failure flag
        failedProfileCreations.delete(userId)
      }
      return exists
    } catch {
      return false
    }
  }
}

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
  // Ensure profile exists before attempting to create progress
  const profileExists = await ensureProfileExists(userId)
  if (!profileExists) {
    // Don't log this error - it's expected for users without profiles
    // Just silently fail to avoid spam
    return null
  }

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
  } catch (error: any) {
    // If enum doesn't exist, try using raw SQL as fallback
    if (isEnumError(error)) {
      logErrorOnce('LessonProgressStatus enum not found, using raw SQL fallback', error, 'warn')
      try {
        // Use raw SQL to insert/update without enum casting
        const statusValue = (data.status || 'in_progress') as string
        const result = await prisma.$executeRawUnsafe(`
          INSERT INTO user_lesson_progress (
            id, user_id, domain_id, module_id, lesson_id, 
            status, progress_percentage, time_spent_seconds, 
            last_read_position, completed_at, bookmarked, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1::uuid, $2::text, $3::text, $4::text,
            $5::text, $6::integer, $7::integer,
            $8::jsonb, 
            $9::timestamp, 
            $10::boolean, NOW(), NOW()
          )
          ON CONFLICT (user_id, domain_id, module_id, lesson_id)
          DO UPDATE SET
            status = $5::text,
            progress_percentage = $6::integer,
            time_spent_seconds = $7::integer,
            last_read_position = $8::jsonb,
            completed_at = $9::timestamp,
            bookmarked = $10::boolean,
            updated_at = NOW()
          RETURNING *
        `, 
          userId, 
          domainId, 
          moduleId, 
          lessonId,
          statusValue,
          data.progress_percentage || 0,
          data.time_spent_seconds || 0,
          JSON.stringify(data.last_read_position || {}),
          data.completed_at ? new Date(data.completed_at) : null,
          data.bookmarked || false
        )
        
        // Fetch the updated record using raw SQL (without enum)
        const updated = await prisma.$queryRawUnsafe<any>(`
          SELECT * FROM user_lesson_progress
          WHERE user_id = $1::uuid
            AND domain_id = $2::text
            AND module_id = $3::text
            AND lesson_id = $4::text
        `, userId, domainId, moduleId, lessonId)
        
        if (updated && updated[0]) {
          const p = updated[0]
          return {
            id: p.id,
            user_id: p.user_id,
            domain_id: p.domain_id,
            module_id: p.module_id,
            lesson_id: p.lesson_id,
            status: p.status as any,
            progress_percentage: Number(p.progress_percentage),
            time_spent_seconds: Number(p.time_spent_seconds),
            last_read_position: p.last_read_position as Record<string, any>,
            completed_at: p.completed_at ? new Date(p.completed_at).toISOString() : null,
            bookmarked: Boolean(p.bookmarked),
            created_at: new Date(p.created_at).toISOString(),
            updated_at: new Date(p.updated_at).toISOString(),
          }
        }
      } catch (rawError: any) {
        // Check if it's a foreign key error - user might not exist in profiles table
        if (isForeignKeyError(rawError)) {
          logErrorOnce('Foreign key constraint failed - user may not exist in profiles table', rawError, 'error')
          // Don't retry - this is a data integrity issue
          return null
        }
        logErrorOnce('Raw SQL fallback also failed', rawError, 'error')
      }
    }
    // Only log non-enum errors (enum errors already handled above)
    if (!isEnumError(error)) {
      logErrorOnce('Error updating lesson progress', error, 'error')
    }
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
