import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getCurrentUser } from '@/lib/auth/get-user'
import { cache, CacheTags, getCachedUserData } from '@/lib/cache'
import { getAllLearningPaths } from '@/lib/learning-paths'
import { prisma } from '@/lib/prisma/server'
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Curated Learning Paths | Execemy',
  description: 'Thematic collections that solve specific challenges and job-to-be-done scenarios',
}

export default async function LearningPathsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Cache learning paths (1 hour revalidate)
  const getCachedPaths = cache(
    async () => getAllLearningPaths(),
    ['library', 'paths', 'all'],
    {
      tags: [CacheTags.CURRICULUM],
      revalidate: 3600, // 1 hour
    }
  )
  
  // Cache user lesson progress (2 minutes revalidate)
  const getCachedLessonProgress = getCachedUserData(
    user.id,
    () => prisma.userLessonProgress.findMany({
      where: { userId: user.id },
    }),
    ['lesson', 'progress'],
    {
      tags: [CacheTags.USER_PROGRESS],
      revalidate: 120, // 2 minutes
    }
  )
  
  const [allPaths, lessonProgress] = await Promise.all([
    getCachedPaths(),
    getCachedLessonProgress(),
  ])

  const pathsWithProgress = await Promise.all(
    allPaths.map(async (path) => {
      let completedCount = 0
      const totalItems = path.items.length

      for (const item of path.items) {
        if (item.type === 'lesson') {
          const progress = lessonProgress.find(
            p => p.domainId === item.domain &&
                 p.moduleId === item.module &&
                 p.lessonId === item.lesson &&
                 p.status === 'completed'
          )
          if (progress) {
            completedCount++
          }
        } else if (item.type === 'case' && item.caseId) {
          const simulation = await prisma.simulation.findFirst({
            where: {
              userId: user.id,
              caseId: item.caseId,
              status: 'completed',
            },
          }).catch(() => null)
          if (simulation) {
            completedCount++
          }
        }
      }

      return {
        ...path,
        progress: {
          completed: completedCount,
          total: totalItems,
          percentage: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
        },
      }
    })
  )

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Curated Learning Paths</h1>
        <p className="text-sm text-gray-600">
          Thematic collections that solve specific challenges and job-to-be-done scenarios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pathsWithProgress.map((path) => (
          <Link
            key={path.id}
            href={`/library/paths/${path.id}`}
            className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{path.title}</h3>
                {path.progress.percentage === 100 && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
              </div>

              {path.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{path.description}</p>
              )}

              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{path.duration}</span>
                </div>
                <span>{path.progress.total} items</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {path.progress.completed} / {path.progress.total}
                  </span>
                </div>
                <Progress value={path.progress.percentage} className="h-2" />
              </div>

              <Button
                variant="outline"
                className="w-full border-gray-300 hover:border-gray-400 rounded-none text-sm"
                asChild
              >
                <div className="flex items-center justify-center gap-2">
                  {path.progress.percentage === 100 ? 'Review Path' : 'Continue Path'}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Button>
            </div>
          </Link>
        ))}
      </div>

      {pathsWithProgress.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-600">No learning paths available at this time.</p>
        </div>
      )}
    </div>
  )
}

