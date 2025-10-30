import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownPreview from '@/components/ui/markdown-preview'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { CheckCircle2, Clock, Signal } from 'lucide-react'
import Link from 'next/link'

export default async function SimulationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Get all published cases with associated competencies with error handling
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
      },
    })
  } catch (error) {
    console.error('Error fetching completed simulations:', error)
  }

  const completedCaseIds = new Set(completedSimulations.map((s: any) => s.caseId))

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
      },
    })
  } catch (error) {
    console.error('Error fetching in-progress simulations:', error)
  }

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">The Arena</h1>
        <p className="mt-2 text-gray-600">Deploy to scenarios and apply your analytical frameworks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => {
          const isCompleted = completedCaseIds.has(caseItem.id)
          const isInProgress = inProgressCaseIds.has(caseItem.id)
          const competencies = caseItem.competencies
            .map((cc) => cc.competency.name)
            .filter(Boolean)

          return (
            <Card 
              key={caseItem.id} 
              className={`
                transition-all duration-200 hover:shadow-lg hover:-translate-y-1
                ${isCompleted ? 'border-green-200 bg-green-50' : ''}
                ${isInProgress ? 'border-blue-200 bg-blue-50' : ''}
              `}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">{caseItem.title}</CardTitle>
                  </div>
                  {isCompleted && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </Badge>
                  )}
                  {isInProgress && !isCompleted && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      In Progress
                    </Badge>
                  )}
                </div>
                
                <CardDescription>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {caseItem.difficulty && (
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${getDifficultyColor(caseItem.difficulty)}`}
                      >
                        <Signal className="h-3 w-3 mr-1" />
                        {caseItem.difficulty}
                      </Badge>
                    )}
                    {caseItem.estimatedMinutes && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {caseItem.estimatedMinutes} min
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {competencies.map((comp, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <MarkdownPreview content={caseItem.briefingDoc || ''} maxLength={120} />
                </div>
                <Button asChild className="w-full" variant={isInProgress ? 'default' : isCompleted ? 'outline' : 'default'}>
                  <Link href={`/simulations/${caseItem.id}/brief`}>
                    {isInProgress ? 'Continue' : isCompleted ? 'Review Case' : 'Deploy to Scenario'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(!cases || cases.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">No simulations available yet. Check back soon!</p>
        </div>
      )}
    </div>
  )
}


