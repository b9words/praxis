'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { bookmarkLesson, markLessonCompleted, updateLessonProgress } from '@/lib/progress-tracking'
import { revalidatePath } from 'next/cache'

export interface ProgressUpdatePayload {
  domainId: string
  moduleId: string
  lessonId: string
  status?: 'not_started' | 'in_progress' | 'completed'
  progressPercentage?: number
  timeSpentSeconds?: number
  lastReadPosition?: Record<string, any>
}

/**
 * Save lesson progress
 */
export async function saveLessonProgress(payload: ProgressUpdatePayload) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const result = await updateLessonProgress(
      user.id,
      payload.domainId,
      payload.moduleId,
      payload.lessonId,
      {
        status: payload.status,
        progress_percentage: payload.progressPercentage,
        time_spent_seconds: payload.timeSpentSeconds,
        last_read_position: payload.lastReadPosition
      }
    )

    if (!result) {
      // Don't return error for profile issues - just silently fail
      return { success: true, data: null }
    }

    // Only revalidate on significant progress changes or completion (not every save)
    if (payload.status === 'completed' || (payload.progressPercentage && payload.progressPercentage >= 100)) {
      revalidatePath(`/library/curriculum/${payload.domainId}/${payload.moduleId}/${payload.lessonId}`)
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error saving lesson progress:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Mark lesson as completed
 */
export async function markLessonAsCompleted(
  domainId: string,
  moduleId: string,
  lessonId: string
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const result = await markLessonCompleted(user.id, domainId, moduleId, lessonId)

    if (!result) {
      return { success: false, error: 'Failed to mark lesson as completed' }
    }

    // Revalidate relevant paths
    revalidatePath(`/library/curriculum/${domainId}/${moduleId}/${lessonId}`)
    revalidatePath(`/library/curriculum/${domainId}/${moduleId}`)
    revalidatePath(`/library/curriculum/${domainId}`)
    revalidatePath('/library')

    return { success: true }
  } catch (error) {
    console.error('Error marking lesson as completed:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Toggle bookmark status
 */
export async function toggleBookmark(
  domainId: string,
  moduleId: string,
  lessonId: string,
  bookmarked: boolean
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const result = await bookmarkLesson(user.id, domainId, moduleId, lessonId, bookmarked)

    if (!result) {
      return { success: false, error: 'Failed to update bookmark' }
    }

    // Revalidate relevant paths
    revalidatePath(`/library/curriculum/${domainId}/${moduleId}/${lessonId}`)
    revalidatePath('/library/bookmarks')

    return { success: true, bookmarked }
  } catch (error) {
    console.error('Error toggling bookmark:', error)
    return { success: false, error: 'Internal server error' }
  }
}

