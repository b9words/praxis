import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getAllLessonsFlat } from '@/lib/curriculum-data'
import { getAllUserProgress, getUserReadingStats } from '@/lib/progress-tracking'
import { getCachedUserData, cache, CacheTags } from '@/lib/cache'
import { listCases } from '@/lib/db/cases'
import { getPopularLessons } from '@/lib/db/progress'
import { getPopularSimulations } from '@/lib/db/simulations'
import { getAllInteractiveSimulations } from '@/lib/case-study-loader'
import LibraryTabs from '@/components/library/LibraryTabs'
import EmptyState from '@/components/ui/empty-state'
import { BookOpen, CheckCircle, Clock, GraduationCap, Target, TrendingUp, ArrowRight, Bookmark } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'

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
  let bookmarkedLessons: Array<{
    domainId: string
    moduleId: string
    lessonId: string
    title: string
    domainTitle: string
    moduleTitle: string
    progress: number
  }> = []
  let allCaseStudies: Array<{
    id: string
    title: string
    description: string
    url: string
    estimatedMinutes?: number
    difficulty?: string
  }> = []
  let trendingLessons: Array<{
    domainId: string
    moduleId: string
    lessonId: string
    title: string
    url: string
  }> = []
  let trendingCases: Array<{
    id: string
    title: string
    url: string
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

    // Get bookmarked lessons
    const bookmarkedProgress = progressArray.filter((p) => p.bookmarked)
    bookmarkedLessons = bookmarkedProgress
      .map((progress) => {
        const lesson = allLessons.find(
          l => l.domain === progress.domain_id && 
               l.moduleId === progress.module_id && 
               l.lessonId === progress.lesson_id
        )
        if (lesson) {
          return {
            domainId: progress.domain_id,
            moduleId: progress.module_id,
            lessonId: progress.lesson_id,
            title: lesson.lessonTitle,
            domainTitle: lesson.domainTitle,
            moduleTitle: lesson.moduleTitle,
            progress: progress.progress_percentage || 0,
          }
        }
        return null
      })
      .filter(Boolean) as typeof bookmarkedLessons
  }

  // Get all case studies
  try {
    const cases = await listCases({})
    const allSimulations = getAllInteractiveSimulations()
    
    allCaseStudies = cases.map((c) => {
      const metadata = c.metadata as any || {}
      const caseId = metadata.caseId || c.id
      return {
        id: caseId,
        title: c.title,
        description: c.description || '',
        url: `/library/case-studies/${caseId}`,
        estimatedMinutes: c.estimatedMinutes ?? undefined,
        difficulty: c.difficulty || undefined,
      }
    })
    
    // Also include JSON-based simulations
    allSimulations.forEach((sim) => {
      if (!allCaseStudies.some(c => c.id === sim.caseId)) {
        allCaseStudies.push({
          id: sim.caseId,
          title: sim.title,
          description: sim.description || '',
          url: `/library/case-studies/${sim.caseId}`,
          estimatedMinutes: sim.estimatedDuration,
          difficulty: sim.difficulty,
        })
      }
    })
  } catch (error) {
    console.error('Error loading case studies:', error)
  }

  // Get trending content
  try {
    const popularLessonsData = await getPopularLessons(6)
    const allLessons = getAllLessonsFlat()
    
    trendingLessons = popularLessonsData
      .map((pop) => {
        const lesson = allLessons.find(
          l => l.domain === pop.domainId &&
               l.moduleId === pop.moduleId &&
               l.lessonId === pop.lessonId
        )
        if (lesson) {
          return {
            domainId: pop.domainId,
            moduleId: pop.moduleId,
            lessonId: pop.lessonId,
            title: lesson.lessonTitle,
            url: `/library/curriculum/${pop.domainId}/${pop.moduleId}/${pop.lessonId}`,
          }
        }
        return null
      })
      .filter(Boolean) as typeof trendingLessons

    const popularSimsData = await getPopularSimulations(6)
    const allSimulations = getAllInteractiveSimulations()
    
    trendingCases = popularSimsData
      .map((pop) => {
        const sim = allSimulations.find(s => s.caseId === pop.caseId)
        if (sim) {
          return {
            id: pop.caseId,
            title: sim.title,
            url: `/library/case-studies/${pop.caseId}`,
          }
        }
        return null
      })
      .filter(Boolean) as typeof trendingCases
  } catch (error) {
    console.error('Error loading trending content:', error)
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

  // Content components for tabs
  const continueContent = (
    <div className="p-4 space-y-6">
      {/* Continue Learning Section */}
      {user && inProgressLessons.length > 0 ? (
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
                      <span className="text-xs text-neutral-500">
                        {isCompleted ? 'Completed' : lesson.progress > 0 ? 'In progress' : 'Not started'}
                      </span>
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
      ) : (
        <EmptyState
          icon={ArrowRight}
          title="Nothing in progress"
          description="Start a lesson or case study to track your progress here. Your learning journey begins with a single step."
          action={{
            label: "Browse Curriculum",
            href: "/library/curriculum"
          }}
        />
      )}
    </div>
  )

  const articlesContent = (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">All Articles</h2>
        <Button variant="outline" size="sm" className="h-8 px-2.5 border-gray-300 hover:border-gray-400 rounded-none text-xs" asChild>
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
                    <span className="text-xs text-neutral-500">
                      {isCompleted ? 'Completed' : 'Not started'}
                    </span>
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
  )

  const caseStudiesContent = (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">All Case Studies</h2>
        <Button variant="outline" size="sm" className="h-8 px-2.5 border-gray-300 hover:border-gray-400 rounded-none text-xs" asChild>
          <Link href="/library/case-studies">VIEW ALL</Link>
        </Button>
      </div>
      {allCaseStudies.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {allCaseStudies.map((caseStudy) => (
            <Link key={caseStudy.id} href={caseStudy.url}>
              <div className="bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Target className="h-4 w-4 text-neutral-400" />
                    {caseStudy.difficulty && (
                      <div className="px-2 py-1 text-xs font-medium border border-neutral-200 bg-neutral-100 text-neutral-700">
                        {caseStudy.difficulty.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-semibold leading-tight text-neutral-900 mb-2 break-words">
                    {caseStudy.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-snug mb-4 break-words line-clamp-2">
                    {caseStudy.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-500 flex items-center gap-2">
                      {caseStudy.estimatedMinutes && (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>{caseStudy.estimatedMinutes} min</span>
                        </>
                      )}
                    </div>
                    <Button size="sm" className="h-6 px-2 text-xs bg-gray-900 text-white hover:bg-gray-800 rounded-none">
                      START
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No case studies available"
          description="Case studies are currently being developed. Check back soon, or explore the curriculum to build your foundational knowledge first."
          action={{
            label: "Explore Curriculum",
            href: "/library/curriculum"
          }}
        />
      )}
    </div>
  )

  const savedContent = (
    <div className="p-4 space-y-6">
      {user && bookmarkedLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarkedLessons.map((lesson) => {
            const progressKey = `${lesson.domainId}:${lesson.moduleId}:${lesson.lessonId}`
            return (
              <Link key={progressKey} href={`/library/curriculum/${lesson.domainId}/${lesson.moduleId}/${lesson.lessonId}`}>
                <div className="bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-xs text-neutral-400 font-mono">
                        {lesson.domainTitle.substring(0, 3).toUpperCase()}
                      </div>
                      <Target className="h-3 w-3 text-neutral-400" />
                    </div>
                    <h3 className="text-base font-semibold leading-tight text-neutral-900 mb-2 break-words">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-snug mb-3 break-words">
                      {lesson.moduleTitle}
                    </p>
                    {lesson.progress > 0 && (
                      <div className="text-xs text-neutral-500 mb-3">{lesson.progress}% complete</div>
                    )}
                    <Button size="sm" className="h-6 px-2 text-xs bg-gray-900 text-white hover:bg-gray-800 rounded-none w-full">
                      {lesson.progress > 0 ? 'CONTINUE' : 'START'}
                    </Button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="No saved items"
          description="Bookmark lessons and case studies while browsing to save them for later. Your saved items will appear here for quick access."
          action={{
            label: "Browse Content",
            href: "/library/curriculum"
          }}
        />
      )}
    </div>
  )

  const trendingContent = (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trending Lessons */}
        <div>
          <h3 className="text-base font-semibold text-neutral-900 mb-4">Trending Articles</h3>
          {trendingLessons.length > 0 ? (
            <div className="space-y-2">
              {trendingLessons.map((lesson) => (
                <Link key={lesson.url} href={lesson.url}>
                  <div className="bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-neutral-900 mb-1">{lesson.title}</h4>
                        <p className="text-xs text-neutral-500">{lesson.domainId}</p>
                      </div>
                      <BookOpen className="h-4 w-4 text-neutral-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No trending articles yet</p>
          )}
        </div>

        {/* Trending Cases */}
        <div>
          <h3 className="text-base font-semibold text-neutral-900 mb-4">Trending Case Studies</h3>
          {trendingCases.length > 0 ? (
            <div className="space-y-2">
              {trendingCases.map((caseStudy) => (
                <Link key={caseStudy.url} href={caseStudy.url}>
                  <div className="bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-neutral-900 mb-1">{caseStudy.title}</h4>
                      </div>
                      <Target className="h-4 w-4 text-neutral-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No trending case studies yet</p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Desktop Header */}
      <div className="hidden md:block border-b border-neutral-200 bg-white flex-shrink-0">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold leading-tight text-neutral-900">
            Intelligence Library
          </h1>
          <p className="mt-1 text-sm text-neutral-500 leading-snug">
            Foundational knowledge for business decision-making
          </p>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="flex-1 overflow-auto">
        <div className="w-full">
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

          {/* Library Tabs */}
          <LibraryTabs
            continueContent={continueContent}
            articlesContent={articlesContent}
            caseStudiesContent={caseStudiesContent}
            savedContent={savedContent}
            trendingContent={trendingContent}
          />
        </div>
      </div>
    </div>
  )
}