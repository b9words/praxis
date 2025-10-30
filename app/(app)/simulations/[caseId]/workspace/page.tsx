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

  // Fetch case details
  const caseItem = await prisma.case.findFirst({
    where: {
      id: caseId,
      status: 'published',
    },
  })

  if (!caseItem) {
    notFound()
  }

  // Check for existing simulation
  let simulation = await prisma.simulation.findFirst({
    where: {
      userId: user.id,
      caseId: caseId,
    },
  })

  // If simulation is completed, redirect to debrief
  if (simulation?.status === 'completed') {
    redirect(`/debrief/${simulation.id}`)
  }

  // Create new simulation if none exists
  if (!simulation) {
    simulation = await prisma.simulation.create({
      data: {
        userId: user.id,
        caseId: caseId,
        status: 'in_progress',
        userInputs: {},
      },
    })
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
