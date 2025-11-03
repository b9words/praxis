import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MarkdownPreview from '@/components/ui/markdown-preview'
import { getCurrentUser } from '@/lib/auth/get-user'
import { isEnumError } from '@/lib/prisma-enum-fallback'
import { prisma } from '@/lib/prisma/server'
import { getCachedUserData, cache, CacheTags } from '@/lib/cache'
import { CheckCircle2, Clock, Signal } from 'lucide-react'
import Link from 'next/link'

export default async function SimulationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Cache published cases list (15 minutes revalidate)
  const getCachedCases = cache(
    async () => {
      let cases: any[] = []
      try {
        cases = await prisma.case.findMany({
          where: {
            status: 'published',
          },
          include: {
            competencies: {
              include: {
                competency: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })
      } catch (error: any) {
        // If enum doesn't exist, fall back to querying without status filter
        if (error?.code === 'P2034' || error?.message?.includes('ContentStatus') || error?.message?.includes('42704')) {
          try {
            cases = await prisma.case.findMany({
              include: {
                competencies: {
                  include: {
                    competency: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            })
          } catch (fallbackError) {
            console.error('Error fetching cases (fallback):', fallbackError)
          }
        } else {
          console.error('Error fetching cases:', error)
        }
      }
      return cases
    },
    ['simulations', 'cases', 'published'],
    {
      tags: [CacheTags.CASES],
      revalidate: 900, // 15 minutes
    }
  )

  // Cache user simulation status (5 minutes revalidate)
  const getCachedUserSimulations = getCachedUserData(
    user.id,
    async () => {
      // Get user's completed simulations with error handling
      let completedSimulations: any[] = []
      try {
        completedSimulations = await prisma.simulation.findMany({
          where: {
            userId: user.id,
            status: 'completed',
          },
          select: {
            caseId: true,
            completedAt: true,
          },
        })
      } catch (error: any) {
        if (isEnumError(error)) {
          // Fallback: query without status filter, filter by completedAt
          try {
            const allSimulations = await prisma.simulation.findMany({
              where: {
                userId: user.id,
              },
              select: {
                caseId: true,
                completedAt: true,
              },
            })
            completedSimulations = allSimulations.filter((s: any) => s.completedAt !== null)
          } catch (fallbackError) {
            console.error('Error fetching completed simulations (fallback):', fallbackError)
          }
        } else {
          console.error('Error fetching completed simulations:', error)
        }
      }

      // Check for in-progress simulations with error handling
      let inProgressSimulations: any[] = []
      try {
        inProgressSimulations = await prisma.simulation.findMany({
          where: {
            userId: user.id,
            status: 'in_progress',
          },
          select: {
            caseId: true,
            completedAt: true,
          },
        })
      } catch (error: any) {
        if (isEnumError(error)) {
          // Fallback: query without status filter, filter by completedAt being null
          try {
            const allSimulations = await prisma.simulation.findMany({
              where: {
                userId: user.id,
              },
              select: {
                caseId: true,
                completedAt: true,
              },
            })
            inProgressSimulations = allSimulations.filter((s: any) => s.completedAt === null)
          } catch (fallbackError) {
            console.error('Error fetching in-progress simulations (fallback):', fallbackError)
          }
        } else {
          console.error('Error fetching in-progress simulations:', error)
        }
      }

      return { completedSimulations, inProgressSimulations }
    },
    ['simulations', 'status'],
    {
      tags: [CacheTags.SIMULATIONS],
      revalidate: 300, // 5 minutes
    }
  )

  const [cases, { completedSimulations, inProgressSimulations }] = await Promise.all([
    getCachedCases(),
    getCachedUserSimulations(),
  ])

  const completedCaseIds = new Set(completedSimulations.map((s: any) => s.caseId))
  const inProgressCaseIds = new Set(inProgressSimulations.map((s) => s.caseId))

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Simulations</h1>
        <p className="text-sm text-gray-600">Deploy to scenarios and apply your analytical frameworks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => {
          const isCompleted = completedCaseIds.has(caseItem.id)
          const isInProgress = inProgressCaseIds.has(caseItem.id)
          const competencies = caseItem.competencies
            .map((cc: any) => cc.competency?.name)
            .filter(Boolean)

          return (
            <div
              key={caseItem.id}
              className={`bg-white border border-gray-200 transition-colors hover:border-gray-300 ${
                isCompleted ? '' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <h3 className="text-base font-medium text-gray-900 flex-1">{caseItem.title}</h3>
                  {isCompleted && (
                    <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  {isInProgress && !isCompleted && (
                    <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                      In Progress
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {caseItem.difficulty && (
                      <Badge
                        variant="outline"
                        className="text-xs font-medium text-gray-700 border-gray-300 capitalize"
                      >
                        <Signal className="h-3 w-3 mr-1" />
                        {caseItem.difficulty}
                      </Badge>
                    )}
                    {caseItem.estimatedMinutes && (
                      <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                        <Clock className="h-3 w-3 mr-1" />
                        {caseItem.estimatedMinutes} min
                      </Badge>
                    )}
                  </div>
                  {competencies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {competencies.map((comp: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs font-medium text-gray-600 border-gray-300">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <MarkdownPreview content={caseItem.briefingDoc || ''} maxLength={120} />
                </div>
                
                <Button asChild className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-none" variant={isInProgress || isCompleted ? 'outline' : 'default'}>
                  <Link href={`/simulations/${caseItem.id}/brief`}>
                    {isInProgress ? 'Continue Engagement' : isCompleted ? 'Review Case' : 'Deploy to Scenario'}
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {(!cases || cases.length === 0) && (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-600">No simulations available at this time.</p>
        </div>
      )}
    </div>
  )
}


