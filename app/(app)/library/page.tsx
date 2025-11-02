import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getAllLessonsFlat } from '@/lib/curriculum-data'
import { getAllUserProgress, getUserReadingStats } from '@/lib/progress-tracking'
import { getCachedUserData, cache, CacheTags } from '@/lib/cache'
import { BookOpen, CheckCircle, Clock, GraduationCap, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function LibraryPage() {
  const user = await getCurrentUser()

  let userProgress: Map<string, any> = new Map()
  let readingStats = null
  let inProgressLessons: Array<{
    domainId: string
    moduleId: string
    lessonId: string
    title: string
    domainTitle: string
    moduleTitle: string
    progress: number
    timeSpent: number
  }> = []
  let recentlyCompletedLessons: Array<{
    domainId: string
    moduleId: string
    lessonId: string
    title: string
    domainTitle: string
    completedAt: string
  }> = []

  if (user) {
    // Cache user progress (2 minutes revalidate)
    // Wrap in a function that ensures Map is preserved
    const getCachedUserProgress = getCachedUserData(
      user.id,
      async () => {
        const progress = await getAllUserProgress(user.id)
        // Convert Map to array of entries for caching, then reconstruct Map
        // This ensures the cache can serialize/deserialize properly
        return Array.from(progress.entries())
      },
      ['progress', 'all'],
      {
        tags: [CacheTags.USER_PROGRESS],
        revalidate: 120, // 2 minutes
      }
    )
    
    // Cache reading stats (2 minutes revalidate)
    const getCachedReadingStats = getCachedUserData(
      user.id,
      () => getUserReadingStats(user.id),
      ['reading', 'stats'],
      {
        tags: [CacheTags.USER_PROGRESS],
        revalidate: 120, // 2 minutes
      }
    )
    
    const [cachedProgressEntries, cachedStats] = await Promise.all([
      getCachedUserProgress(),
      getCachedReadingStats(),
    ])
    
    // Reconstruct Map from cached entries
    if (Array.isArray(cachedProgressEntries)) {
      userProgress = new Map(cachedProgressEntries)
    } else {
      // Fallback: ensure it's at least an empty Map
      userProgress = new Map()
    }
    
    readingStats = cachedStats

    // Get in-progress lessons
    const allLessons = getAllLessonsFlat()
    const progressArray = Array.from(userProgress.values())
    
    progressArray.forEach((progress) => {
      if (progress.status === 'in_progress' || (progress.status === 'completed' && !progress.completed_at)) {
        const lesson = allLessons.find(
          l => l.domain === progress.domain_id && 
               l.moduleId === progress.module_id && 
               l.lessonId === progress.lesson_id
        )
        if (lesson) {
          inProgressLessons.push({
            domainId: progress.domain_id,
            moduleId: progress.module_id,
            lessonId: progress.lesson_id,
            title: lesson.lessonTitle,
            domainTitle: lesson.domainTitle,
            moduleTitle: lesson.moduleTitle,
            progress: progress.progress_percentage || 0,
            timeSpent: progress.time_spent_seconds || 0
          })
        }
      }
    })

    // Get recently completed lessons (last 5)
    const completedProgress = progressArray
      .filter(p => p.status === 'completed' && p.completed_at)
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 5)

    completedProgress.forEach((progress) => {
      const lesson = allLessons.find(
        l => l.domain === progress.domain_id && 
             l.moduleId === progress.module_id && 
             l.lessonId === progress.lesson_id
      )
      if (lesson) {
        recentlyCompletedLessons.push({
          domainId: progress.domain_id,
          moduleId: progress.module_id,
          lessonId: progress.lesson_id,
          title: lesson.lessonTitle,
          domainTitle: lesson.domainTitle,
          completedAt: progress.completed_at
        })
      }
    })
  }

  // Cache recommended lessons (15 minutes revalidate)
  const getCachedRecommendedLessons = cache(
    () => {
      const allLessons = getAllLessonsFlat()
      return allLessons.slice(0, 6) // For now, just show first 6 lessons
    },
    ['library', 'recommended', 'lessons'],
    {
      tags: [CacheTags.CURRICULUM],
      revalidate: 900, // 15 minutes
    }
  )
  const recommendedLessons = await getCachedRecommendedLessons()

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Desktop Header */}
      <div className="hidden md:block border-b border-neutral-200 bg-white flex-shrink-0">
        <div className="px-0 py-4">
          <h1 className="text-xl font-semibold leading-tight text-neutral-900">
            Intelligence Library
        </h1>
          <p className="mt-1 text-sm text-neutral-500 leading-snug">
            Foundational knowledge for business decision-making
          </p>
        </div>
      </div>

      {/* Content - ZERO MARGINS */}
      <div className="flex-1 overflow-auto">
        <div className="p-0 space-y-6 w-full">
          
          {/* Quick Stats Dashboard */}
          {user && readingStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-neutral-200">
              <div className="bg-neutral-50 border border-neutral-200 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-neutral-900">{readingStats.totalLessonsCompleted}</div>
                    <div className="text-xs text-neutral-500">Completed</div>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-neutral-900">{Math.round(readingStats.totalTimeSpentSeconds / 60)}</div>
                    <div className="text-xs text-neutral-500">Minutes</div>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-neutral-900">{readingStats.lessonsInProgress}</div>
                    <div className="text-xs text-neutral-500">In Progress</div>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-neutral-900">{readingStats.totalBookmarks}</div>
                    <div className="text-xs text-neutral-500">Bookmarked</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="bg-neutral-50 border border-neutral-200 p-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-900">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium leading-tight text-neutral-900 mb-1">
                    Executive Curriculum
                  </h3>
                  <p className="text-sm text-neutral-500 leading-snug mb-3">
                    10 domains, 219 lessons for world-class leadership
                  </p>
                  <Button asChild size="sm" className="h-8 px-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-none">
                    <Link href="/library/curriculum">Explore Curriculum</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 p-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 border border-gray-200">
                  <BookOpen className="h-4 w-4 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium leading-tight text-neutral-900 mb-1">
                    Learning Paths
                  </h3>
                  <p className="text-sm text-neutral-500 leading-snug mb-3">
                    Structured curriculum to guide your learning journey
                  </p>
                  <Button asChild variant="outline" size="sm" className="h-8 px-2.5 border-gray-300 hover:border-gray-400 rounded-none">
                    <Link href="/residency">Choose Path</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Continue Learning Section */}
          {user && inProgressLessons.length > 0 && (
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Continue Learning</h2>
                <Button variant="outline" size="sm" className="h-8 px-2.5 border-gray-300 hover:border-gray-400 rounded-none text-xs" asChild>
                  <Link href="/library/curriculum">VIEW ALL</Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressLessons.slice(0, 6).map((lesson) => {
                  const progressKey = `${lesson.domainId}:${lesson.moduleId}:${lesson.lessonId}`
                  const lessonProgress = userProgress.get(progressKey)
                  const isCompleted = lessonProgress?.status === 'completed'
                  
                  return (
                    <Link key={progressKey} href={`/library/curriculum/${lesson.domainId}/${lesson.moduleId}/${lesson.lessonId}`}>
                      <div className="bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer">
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-xs text-neutral-400 font-mono">
                              {lesson.domainTitle.substring(0, 3).toUpperCase()}
                            </div>
                            <div className="text-xs text-neutral-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.round(lesson.timeSpent / 60)} min
                            </div>
                          </div>
                          
                          <h3 className="text-base font-semibold leading-tight text-neutral-900 mb-2 break-words">
                            {lesson.title}
                          </h3>
                          
                          <p className="text-xs text-neutral-500 leading-snug mb-3 break-words">
                            {lesson.moduleTitle}
                          </p>

                          {/* Progress Bar */}
                          {lesson.progress > 0 && (
                            <div className="mb-3">
                                  <div className="w-full bg-neutral-200 h-1.5">
                                <div 
                                  className="bg-gray-900 h-1.5 transition-all" 
                                  style={{ width: `${lesson.progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-neutral-500 mt-1">{lesson.progress}% complete</div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <div className="w-4 h-4 bg-gray-900 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : lesson.progress > 0 ? (
                                <div className="w-4 h-4 border-2 border-gray-600 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-gray-600" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 border-2 border-neutral-300"></div>
                              )}
                              <span className="text-xs text-neutral-500">
                                {isCompleted ? 'Completed' : lesson.progress > 0 ? 'In progress' : 'Not started'}
                              </span>
                            </div>
                            
                            <Button size="sm" className="h-6 px-2 text-xs bg-gray-900 text-white hover:bg-gray-800 rounded-none">
                              {lesson.progress > 0 ? 'CONTINUE' : 'START'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recommended for You */}
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Recommended for You</h2>
              <Button variant="outline" size="sm" className="h-8 px-2.5 bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200 rounded text-xs" asChild>
                <Link href="/library/curriculum">VIEW ALL</Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedLessons.map((lesson, index) => {
                const progressKey = `${lesson.domain}:${lesson.moduleId}:${lesson.lessonId}`
                const lessonProgress = user?.id ? userProgress.get(progressKey) : null
                const isCompleted = lessonProgress?.status === 'completed'
                
                return (
                  <Link key={progressKey} href={`/library/curriculum/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`}>
                    <div className="bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-xs text-neutral-400 font-mono">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className="text-xs text-neutral-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            12 min
                          </div>
                </div>
                        
                        <h3 className="text-base font-semibold leading-tight text-neutral-900 mb-2 break-words">
                          {lesson.lessonTitle}
                  </h3>
                        
                        <p className="text-sm text-neutral-500 leading-snug mb-4 break-words overflow-hidden">
                          {lesson.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                                <div className="w-4 h-4 bg-gray-900 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>
                            )}
                            <span className="text-xs text-neutral-500">
                              {isCompleted ? 'Completed' : 'Not started'}
                            </span>
                          </div>
                          
                          <Button size="sm" className="h-6 px-2 text-xs bg-gray-900 text-white hover:bg-gray-800 rounded-none">
                            START
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4 p-4">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
            {recentlyCompletedLessons.length > 0 ? (
              <div className="space-y-2">
                {recentlyCompletedLessons.map((lesson) => {
                  const progressKey = `${lesson.domainId}:${lesson.moduleId}:${lesson.lessonId}`
                  const date = new Date(lesson.completedAt)
                  const timeAgo = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  
                  return (
                    <Link key={progressKey} href={`/library/curriculum/${lesson.domainId}/${lesson.moduleId}/${lesson.lessonId}`}>
                      <div className="bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer">
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-neutral-900">{lesson.title}</div>
                                <div className="text-xs text-neutral-500">{lesson.domainTitle} • {timeAgo}</div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-neutral-600">
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-neutral-50 border border-neutral-200 p-4">
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-8 w-8 text-neutral-400 mb-3" />
                  <h3 className="text-sm font-medium text-neutral-900 mb-1">No recent activity</h3>
                  <p className="text-sm text-neutral-500">
                    Start a lesson to see your progress here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}