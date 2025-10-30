import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  // Check if user has an in-progress simulation
  const existingSimulation = await prisma.simulation.findFirst({
    where: {
      userId: user.id,
      caseId: caseId,
      status: 'in_progress',
    },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{caseItem.title}</h1>
        <p className="mt-2 text-gray-600">Case Briefing</p>
      </div>

      <Card className="bg-white border border-neutral-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">Case Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownRenderer content={caseItem.briefingDoc || ''} />
        </CardContent>
      </Card>

      {caseItem.datasets && (
        <Card>
          <CardHeader>
            <CardTitle>Case Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(caseItem.datasets, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-6">
        <Button asChild variant="outline">
          <Link href="/simulations">Back to Simulations</Link>
        </Button>
        <Button asChild size="lg">
          <Link href={`/simulations/${caseId}/workspace`}>
            {existingSimulation ? 'Continue Simulation' : 'Start Simulation'}
          </Link>
        </Button>
      </div>
    </div>
  )
}
