import { getCurrentUser } from '@/lib/auth/get-user'
import { getCaseByIdWithCompetencies } from '@/lib/db/cases'
import { redirect, notFound } from 'next/navigation'
import CommunityResponses from '@/components/case-study/CommunityResponses'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CaseCommunityPage({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const { caseId } = await params

  // Fetch case details
  const caseItem = await getCaseByIdWithCompetencies(caseId).catch(() => null)
  
  if (!caseItem || !caseItem.published) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mb-4 rounded-none"
          >
            <Link href={`/library/case-studies/${caseId}/debrief`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Debrief
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Community Hub
          </h1>
          <p className="text-lg text-gray-600">
            {caseItem.title}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Explore how others approached this case study and learn from the community
          </p>
        </div>

        {/* Community Responses with sorting */}
        <CommunityResponses
          caseId={caseId}
          userId={user.id}
          isCompleted={true}
        />
      </div>
    </div>
  )
}


