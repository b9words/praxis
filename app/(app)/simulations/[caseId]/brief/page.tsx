import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { getCachedUserData, getCachedCase, CacheTags } from '@/lib/cache'
import { AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CaseBriefPage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { caseId } = await params

  // Cache case lookup (1 hour revalidate) - use existing helper
  let caseItem = null
  try {
    caseItem = await getCachedCase(caseId)
    if (!caseItem) {
      // Fallback if not found in cache
      caseItem = await prisma.case.findFirst({
        where: {
          id: caseId,
          status: 'published',
        },
      })
      if (!caseItem) {
        notFound()
      }
    }
  } catch (error: any) {
    // If enum doesn't exist, fall back to querying without status filter
    if (error?.code === 'P2034' || error?.message?.includes('ContentStatus') || error?.message?.includes('42704')) {
      try {
        caseItem = await prisma.case.findFirst({
          where: {
            id: caseId,
          },
        })
        if (!caseItem) {
          notFound()
        }
      } catch (fallbackError) {
        console.error('Error fetching case:', fallbackError)
        notFound()
      }
    } else {
      console.error('Error fetching case:', error)
      notFound()
    }
  }

  if (!caseItem) {
    notFound()
  }

  // Cache user simulation status (5 minutes revalidate, userId in key)
  const getCachedSimulationStatus = getCachedUserData(
    user.id,
    async () => {
      // Check if user has an in-progress simulation
      let existingSimulation = null
      try {
        existingSimulation = await prisma.simulation.findFirst({
          where: {
            userId: user.id,
            caseId: caseId,
            status: 'in_progress',
          },
        })
      } catch (error: any) {
        // Handle any Prisma errors gracefully
        // If query fails, just continue without existing simulation
        console.error('Error checking existing simulation:', error)
        existingSimulation = null
      }

      return existingSimulation
    },
    ['simulation', 'status', caseId],
    {
      tags: [CacheTags.SIMULATIONS],
      revalidate: 300, // 5 minutes
    }
  )

  const existingSimulation = await getCachedSimulationStatus()

  // Check prerequisites
  let prerequisites: Array<{ domain: string; module: string; lesson: string; title?: string }> = []
  let prerequisiteProgress: Array<{ completed: boolean; title?: string }> = []
  let allPrerequisitesMet = true
  
  if (caseItem.prerequisites && typeof caseItem.prerequisites === 'object') {
    const prereqs = caseItem.prerequisites as any
    if (Array.isArray(prereqs)) {
      prerequisites = prereqs.filter((p: any) => p.domain && p.module && p.lesson)
      
      if (prerequisites.length > 0) {
        // Cache user's progress on prerequisites (2 minutes revalidate, userId in key)
        const getCachedPrerequisiteProgress = getCachedUserData(
          user.id,
          () => prisma.userLessonProgress.findMany({
            where: {
              userId: user.id,
              OR: prerequisites.map((prereq: any) => ({
                domainId: prereq.domain,
                moduleId: prereq.module,
                lessonId: prereq.lesson,
              })),
            },
          }),
          ['prerequisites', 'progress', caseId],
          {
            tags: [CacheTags.USER_PROGRESS],
            revalidate: 120, // 2 minutes
          }
        )

        const lessonProgress = await getCachedPrerequisiteProgress()
        
        prerequisiteProgress = prerequisites.map((prereq: any) => {
          const progress = lessonProgress.find(
            p => p.domainId === prereq.domain &&
                 p.moduleId === prereq.module &&
                 p.lessonId === prereq.lesson
          )
          return {
            completed: progress?.status === 'completed' || false,
            title: prereq.title,
          }
        })
        
        allPrerequisitesMet = prerequisiteProgress.every(p => p.completed)
      }
    }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">{caseItem.title}</h1>
        <p className="text-sm text-gray-600">Case Briefing</p>
      </div>

      {/* Prerequisites Banner */}
      {prerequisites.length > 0 && !allPrerequisitesMet && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">Complete These Lessons First</AlertTitle>
          <AlertDescription className="text-yellow-800 mt-2">
            <p className="mb-3">
              Before starting this case study, we recommend completing these foundational lessons:
            </p>
            <div className="space-y-2">
              {prerequisites.map((prereq, idx) => {
                const progress = prerequisiteProgress[idx]
                const lessonUrl = `/library/curriculum/${prereq.domain}/${prereq.module}/${prereq.lesson}`
                
                return (
                  <div
                    key={`${prereq.domain}-${prereq.module}-${prereq.lesson}`}
                    className={`flex items-center gap-2 p-2 rounded border ${
                      progress.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-yellow-200'
                    }`}
                  >
                    {progress.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm flex-1 ${
                      progress.completed ? 'text-green-800 line-through' : 'text-yellow-900'
                    }`}>
                      {prereq.title || `${prereq.domain}/${prereq.module}/${prereq.lesson}`}
                    </span>
                    {!progress.completed && (
                      <Link
                        href={lessonUrl}
                        className="text-xs text-yellow-700 hover:text-yellow-900 underline flex items-center gap-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        Review
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs">
              {prerequisiteProgress.filter(p => p.completed).length} of {prerequisites.length} lessons completed
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Briefing Documents</h2>
        </div>
        <div className="p-6">
          <MarkdownRenderer content={caseItem.briefingDoc || ''} />
        </div>
      </div>

      {caseItem.datasets && (
        <div className="bg-white border border-gray-200 mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Case Data</h2>
          </div>
          <div className="p-6">
            <pre className="bg-gray-50 p-4 border border-gray-200 overflow-x-auto text-xs">
              {JSON.stringify(caseItem.datasets, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
          <Link href="/simulations">Back to Simulations</Link>
        </Button>
        {allPrerequisitesMet || prerequisites.length === 0 || existingSimulation ? (
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            <Link href={`/simulations/${caseId}/workspace`}>
              {existingSimulation ? 'Continue Simulation' : 'Deploy to Scenario'}
            </Link>
          </Button>
        ) : (
          <Button disabled className="bg-gray-400 text-white rounded-none cursor-not-allowed">
            Complete Prerequisites First
          </Button>
        )}
      </div>
    </div>
  )
}
