import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getAllLessonsFlat } from '@/lib/curriculum-data'
import { getAllUserProgress } from '@/lib/progress-tracking'
import { BookOpen, CheckCircle, Clock, Star, Target } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'

export default async function BookmarksPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex-1 overflow-auto">
          <div className="p-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Please sign in</h2>
            <p className="text-sm text-neutral-500">Sign in to view your bookmarked lessons</p>
          </div>
        </div>
      </div>
    )
  }

  let userProgress: Map<string, any> = new Map()
  let bookmarkedLessons: Array<any> = []

  try {
    userProgress = await getAllUserProgress(user.id)
    const allLessons = getAllLessonsFlat()
    const progressArray = Array.from(userProgress.values())

    // Get bookmarked lessons
    const bookmarkedProgress = progressArray.filter((p) => p.bookmarked)

    bookmarkedLessons = bookmarkedProgress
      .map((progress) => {
        const lesson = allLessons.find(
          (l) =>
            l.domain === progress.domain_id &&
            l.moduleId === progress.module_id &&
            l.lessonId === progress.lesson_id
        )
        return lesson
          ? {
              domainId: progress.domain_id,
              moduleId: progress.module_id,
              lessonId: progress.lesson_id,
              title: lesson.lessonTitle,
              domainTitle: lesson.domainTitle,
              moduleTitle: lesson.moduleTitle,
              description: lesson.description,
              status: progress.status,
              progressPercentage: progress.progress_percentage || 0,
              timeSpent: progress.time_spent_seconds || 0,
              completedAt: progress.completed_at,
            }
          : null
      })
      .filter(Boolean) as Array<{
      domainId: string
      moduleId: string
      lessonId: string
      title: string
      domainTitle: string
      moduleTitle: string
      description: string
      status: string
      progressPercentage: number
      timeSpent: number
      completedAt: string | null
    }>
  } catch (error) {
    console.error('Error loading bookmarks:', error)
  }

  // Group by domain
  const groupedByDomain = bookmarkedLessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.domainTitle]) {
        acc[lesson.domainTitle] = []
      }
      acc[lesson.domainTitle].push(lesson)
      return acc
    },
    {} as Record<string, typeof bookmarkedLessons>
  )

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-xl font-semibold leading-tight text-neutral-900">Bookmarked Lessons</h1>
            <p className="text-sm text-neutral-500 leading-snug">
              Quick access to your saved lessons for future reference
            </p>
          </div>

          {bookmarkedLessons.length === 0 ? (
            <div className="bg-neutral-50 border border-neutral-200 p-12">
              <div className="text-center">
                <Star className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                <h3 className="text-base font-medium text-neutral-900 mb-2">No bookmarks yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Start bookmarking lessons to save them for later
                </p>
                <Button asChild size="sm" className="bg-gray-900 text-white hover:bg-gray-800 rounded-none">
                  <Link href="/library/curriculum">Browse Curriculum</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDomain).map(([domainTitle, lessons]) => {
                const typedLessons = lessons as Array<{
                  domainId: string
                  moduleId: string
                  lessonId: string
                  title: string
                  domainTitle: string
                  moduleTitle: string
                  description: string
                  status: string
                  progressPercentage: number
                  timeSpent: number
                  completedAt: string | null
                }>
                
                return (
                <div key={domainTitle} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-neutral-600" />
                    <h2 className="text-base font-semibold text-neutral-900">{domainTitle}</h2>
                    <span className="text-xs text-neutral-500">({typedLessons.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typedLessons.map((lesson) => {
                      const isCompleted = lesson.status === 'completed'

                      return (
                        <Link
                          key={`${lesson.domainId}:${lesson.moduleId}:${lesson.lessonId}`}
                          href={`/library/curriculum/${lesson.domainId}/${lesson.moduleId}/${lesson.lessonId}`}
                        >
                          <div className="bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer h-full">
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-gray-600" />
                                  <span className="text-xs text-neutral-500 font-medium">
                                    {lesson.moduleTitle}
                                  </span>
                                </div>
                                <div className="text-xs text-neutral-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {Math.round(lesson.timeSpent / 60)} min
                                </div>
                              </div>

                              <h3 className="text-base font-medium leading-tight text-neutral-900 mb-2 break-words">
                                {lesson.title}
                              </h3>

                              <p className="text-sm text-neutral-500 leading-snug mb-3 break-words line-clamp-2">
                                {lesson.description}
                              </p>

                              {/* Progress Bar */}
                              {lesson.progressPercentage > 0 && (
                                <div className="mb-3">
                                  <div className="w-full bg-neutral-200 h-1.5">
                                    <div
                                      className="h-1.5 bg-gray-900 transition-all"
                                      style={{ width: `${lesson.progressPercentage}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-1">
                                    {lesson.progressPercentage}% complete
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <div className="w-4 h-4 bg-gray-900 flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 text-white" />
                                    </div>
                                  ) : lesson.progressPercentage > 0 ? (
                                    <div className="w-4 h-4 border-2 border-gray-600 flex items-center justify-center">
                                      <div className="w-2 h-2 bg-gray-600" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-neutral-300"></div>
                                  )}
                                  <span className="text-xs text-neutral-500">
                                    {isCompleted
                                      ? 'Completed'
                                      : lesson.progressPercentage > 0
                                        ? 'In progress'
                                        : 'Not started'}
                                  </span>
                                </div>

                                <Button size="sm" className="h-6 px-2 text-xs bg-gray-900 text-white hover:bg-gray-800 rounded-none">
                                  {lesson.progressPercentage > 0 ? 'CONTINUE' : 'START'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
