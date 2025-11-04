/**
 * Progress tracking module
 * Re-exports from the progress repository for backward compatibility
 */

// Re-export all functions from the progress repository
export {
  getLessonProgress,
  upsertLessonProgress as updateLessonProgress,
  getAllUserProgress,
  getDomainProgress,
  checkDomainCompletion,
  getUserDomainCompletions,
  getUserReadingStats,
  bookmarkLesson,
  markLessonCompleted,
  type LessonProgress,
  type ProgressUpdateData,
  type DomainProgress,
  type UserReadingStats,
} from './db/progress'

export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed'
