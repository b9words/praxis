import SimulationWorkspace from '@/components/simulation/SimulationWorkspace'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { notFound, redirect } from 'next/navigation'

export default async function SimulationWorkspacePage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { caseId } = await params

  // Fetch case details with error handling
  let caseItem = null
  try {
    caseItem = await prisma.case.findFirst({
      where: {
        id: caseId,
        status: 'published',
      },
    })
  } catch (error: any) {
    // If enum doesn't exist, fall back to querying without status filter
    if (error?.code === 'P2034' || error?.message?.includes('ContentStatus') || error?.message?.includes('42704')) {
      try {
        caseItem = await prisma.case.findFirst({
          where: {
            id: caseId,
          },
        })
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

  // Check for existing simulation with error handling
  let simulation = null
  try {
    simulation = await prisma.simulation.findFirst({
      where: {
        userId: user.id,
        caseId: caseId,
      },
    })
  } catch (error) {
    console.error('Error fetching simulation:', error)
  }

  // If simulation is completed, redirect to debrief
  if (simulation?.status === 'completed') {
    redirect(`/debrief/${simulation.id}`)
  }

  // Create new simulation if none exists with error handling
  if (!simulation) {
    try {
      simulation = await prisma.simulation.create({
        data: {
          userId: user.id,
          caseId: caseId,
          status: 'in_progress',
          userInputs: {},
        },
      })
    } catch (error) {
      console.error('Error creating simulation:', error)
      // Return error state instead of crashing
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Error loading simulation</p>
            <p className="text-sm text-gray-600 mt-2">Please try again later</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <SimulationWorkspace
        caseItem={caseItem}
        simulation={simulation}
        userId={user.id}
      />
    </div>
  )
}
