import { Button } from '@/components/ui/button'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CaseBriefPage({ params }: { params: Promise<{ caseId: string }> }) {
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

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">{caseItem.title}</h1>
        <p className="text-sm text-gray-600">Case Briefing</p>
      </div>

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
        <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
          <Link href={`/simulations/${caseId}/workspace`}>
            {existingSimulation ? 'Continue Simulation' : 'Deploy to Scenario'}
          </Link>
        </Button>
      </div>
    </div>
  )
}
