import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getAllLessonsFlat } from '@/lib/curriculum-data'
import { getAllUserProgress } from '@/lib/progress-tracking'
import { getCurrentUser } from '@/lib/auth/get-user'
import { BookOpen, CheckCircle, Clock, Star, Target } from 'lucide-react'
import Link from 'next/link'

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
            <Card className="bg-neutral-50 border border-neutral-200 rounded-lg">
              <CardContent className="p-8">
                <div className="text-center">
                  <Star className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="text-base font-medium text-neutral-900 mb-2">No bookmarks yet</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Start bookmarking lessons to save them for later
                  </p>
                  <Button asChild size="sm" className="bg-blue-700 text-white hover:bg-blue-800">
                    <Link href="/library/curriculum">Browse Curriculum</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDomain).map(([domainTitle, lessons]) => (
                <div key={domainTitle} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-neutral-600" />
                    <h2 className="text-base font-semibold text-neutral-900">{domainTitle}</h2>
                    <span className="text-xs text-neutral-500">({lessons.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lessons.map((lesson) => {
                      const isCompleted = lesson.status === 'completed'

                      return (
                        <Link
                          key={`${lesson.domainId}:${lesson.moduleId}:${lesson.lessonId}`}
                          href={`/library/curriculum/${lesson.domainId}/${lesson.moduleId}/${lesson.lessonId}`}
                        >
                          <Card className="bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs text-neutral-500 font-medium">
                                    {lesson.moduleTitle}
                                  </span>
                                </div>
                                <div className="text-xs text-neutral-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {Math.round(lesson.timeSpent / 60)} min
                                </div>
                              </div>

                              <h3 className="text-base font-semibold leading-tight text-neutral-900 mb-2 break-words">
                                {lesson.title}
                              </h3>

                             接力 <p className="text-sm text-neutral-500 leading-snug mb-3 break-words line-clamp-2">
                                {lesson.description}
                              </p>

                              {/* Progress Bar */}
                              {lesson.progressPercentage > 0 && (
                                <div className="mb-3">
                                  <div className="w-full bg-neutral-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full transition-all ${
                                        isCompleted ? 'bg-green-600' : 'bg-blue-600'
                                      }`}
                                      style={{ width: `${lesson.progressPercentage}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-1">
                                    {lesson.progressPercentage}% complete
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2取的
                                  {isCompleted ? (
                                    <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 text-white" />
                                    </div>
                                  ) : lesson.progressPercentage > 0 ? (
                                    <div className="w-4 h-4 border-2 border-blue-600 rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>
                                  )}
                                  <span className="text-xs text-neutral-500">
                                    {isCompleted
                                      ? 'Completed'
                                      : lesson.progressPercentage > 0
                                        ? 'In progress'
                                        : 'Not started'}
                                  </span>
                                </div>

                                <Button size="sm" className="h-6 px-2 text-xs bg-blue-700 text-white hover:bg-blue-800 rounded">
                                  {lesson.progressPercentage > 0 ? 'CONTINUE' : 'START'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
