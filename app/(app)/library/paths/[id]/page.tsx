import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getCurrentUser } from '@/lib/auth/get-user'
import { cache, CacheTags, getCachedUserData } from '@/lib/cache'
import { getAllInteractiveSimulations } from '@/lib/case-study-loader'
import { getAllLessonsFlat } from '@/lib/curriculum-data'
import { getLearningPathById } from '@/lib/learning-paths'
import { getAllUserProgress } from '@/lib/progress-tracking'
import { getCompletedSimulationByUserAndCase } from '@/lib/db/simulations'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Target } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface LearningPathDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: LearningPathDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const path = await getLearningPathById(id)

  if (!path) {
    return {
      title: 'Learning Path Not Found | Execemy',
    }
  }

  return {
    title: `${path.title} | Execemy`,
    description: path.description || `Curated learning path: ${path.title}`,
  }
}

export default async function LearningPathDetailPage({ params }: LearningPathDetailPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { id } = await params
  const path = await getLearningPathById(id)

  if (!path) {
    notFound()
  }

  // Cache lessons and simulations (1 hour revalidate)
  const getCachedLessonsAndSimulations = cache(
    () => {
      const allLessons = getAllLessonsFlat()
      const allSimulations = getAllInteractiveSimulations()
      return { allLessons, allSimulations }
    },
    ['learning-path', 'lessons-simulations'],
    {
      tags: [CacheTags.CURRICULUM],
      revalidate: 3600, // 1 hour
    }
  )

  // Cache user's progress for this path (2 minutes revalidate, userId in key)
  const getCachedPathProgress = getCachedUserData(
    user.id,
    async () => {
      // Get user's progress for this path
      const progressMap = await getAllUserProgress(user.id)
      const lessonProgress = Array.from(progressMap.values())

      const { allLessons, allSimulations } = await getCachedLessonsAndSimulations()

      // Calculate progress for each item
      const itemsWithProgress = await Promise.all(
        path.items.map(async (item) => {
          if (item.type === 'lesson') {
            const progress = lessonProgress.find(
              (p: any) => p.domain_id === item.domain &&
                   p.module_id === item.module &&
                   p.lesson_id === item.lesson
            )
            
            const lesson = allLessons.find(
              l => l.domain === item.domain &&
                   l.moduleId === item.module &&
                   l.lessonId === item.lesson
            )

            return {
              ...item,
              title: lesson?.lessonTitle || 'Unknown Lesson',
              url: `/library/curriculum/${item.domain}/${item.module}/${item.lesson}`,
              completed: progress?.status === 'completed' || false,
              progress: progress?.progress_percentage || 0,
            }
          } else if (item.type === 'case' && item.caseId) {
            const simulation = await getCompletedSimulationByUserAndCase(user.id, item.caseId).catch(() => null)

            const caseStudy = allSimulations.find(s => s.caseId === item.caseId)

            return {
              ...item,
              title: caseStudy?.title || 'Unknown Case',
              url: `/simulations/${item.caseId}/brief`,
              completed: !!simulation,
              progress: simulation ? 100 : 0,
            }
          }
          // Fallback for items that don't match expected types
          return {
            ...item,
            title: 'Untitled',
            url: '/library/paths',
            completed: false,
            progress: 0,
          }
        })
      )

      return itemsWithProgress
    },
    ['learning-path', id],
    {
      tags: [CacheTags.CURRICULUM, CacheTags.USER_PROGRESS],
      revalidate: 120, // 2 minutes
    }
  )

  const itemsWithProgress = await getCachedPathProgress()

  const completedCount = itemsWithProgress.filter(item => item.completed).length
  const totalItems = itemsWithProgress.length
  const progressPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

  // Find next incomplete item
  const nextIncompleteItem = itemsWithProgress.find(item => !item.completed)
  const nextUrl = nextIncompleteItem?.url || itemsWithProgress[0]?.url || '/library/paths'

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <Link href="/library/paths">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning Paths
          </Link>
        </Button>

        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{path.title}</h1>
        {path.description && (
          <p className="text-base text-gray-600 mb-4">{path.description}</p>
        )}

        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{path.duration}</span>
          </div>
          <span>{totalItems} items</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Your Progress</h2>
          <span className="text-sm font-semibold text-gray-900">
            {progressPercentage}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-3 mb-2" />
        <p className="text-sm text-gray-600">
          {completedCount} of {totalItems} items completed
        </p>
      </div>

      {/* Path Items */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-medium text-gray-900">Path Contents</h2>
        {itemsWithProgress.map((item, index) => (
          <div
            key={`${item.type}-${item.type === 'lesson' ? `${item.domain}-${item.module}-${item.lesson}` : item.caseId}-${index}`}
            className={`bg-white border rounded-lg p-5 transition-colors ${
              item.completed
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {item.type === 'lesson' ? (
                        <BookOpen className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Target className="h-4 w-4 text-gray-400" />
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          item.type === 'lesson'
                            ? 'border-blue-200 text-blue-700'
                            : 'border-purple-200 text-purple-700'
                        }`}
                      >
                        {item.type === 'lesson' ? 'Lesson' : 'Case Study'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      {item.title || 'Untitled'}
                    </h3>
                  </div>
                  {item.completed && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
                {item.type === 'lesson' && item.progress > 0 && item.progress < 100 && (
                  <div className="mt-2">
                    <Progress value={item.progress} className="h-1.5" />
                    <p className="text-xs text-gray-500 mt-1">{item.progress}% complete</p>
                  </div>
                )}
              </div>
              <Button
                variant={item.completed ? 'outline' : 'default'}
                size="sm"
                className={item.completed ? 'border-gray-300' : 'bg-gray-900 hover:bg-gray-800 text-white rounded-none'}
                asChild
                disabled={!item.url}
              >
                {item.url ? (
                  <Link href={item.url}>
                    {item.completed ? 'Review' : 'Start'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                ) : (
                  <span>
                    {item.completed ? 'Review' : 'Start'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        {nextIncompleteItem ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {progressPercentage === 0
                ? 'Start your learning journey'
                : 'Continue your progress'}
            </p>
            <Button
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-none"
              asChild
              disabled={!nextUrl}
            >
              {nextUrl ? (
                <Link href={nextUrl}>
                  {progressPercentage === 0 ? 'Start Path' : 'Continue Path'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              ) : (
                <span>
                  {progressPercentage === 0 ? 'Start Path' : 'Continue Path'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </span>
              )}
            </Button>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-900 mb-2">Path Completed!</p>
            <p className="text-sm text-gray-600 mb-4">
              You've completed all items in this learning path.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="border-gray-300 rounded-none" asChild>
                <Link href="/library/paths">Browse Other Paths</Link>
              </Button>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-none" asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

