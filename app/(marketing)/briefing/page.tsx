import PublicHeader from '@/components/layout/PublicHeader'
import { SectionAccent } from '@/components/layout/SectionAccent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentBriefing } from '@/lib/briefing'
import { getDomainById, getModuleById, getCurriculumStats } from '@/lib/curriculum-data'
import { prisma } from '@/lib/prisma/server'
import { BookOpen, PlayCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Weekly Intelligence Briefing',
  description: 'Each week, our analysts release one module from the Praxis curriculum for public review. Access is complimentary.',
  openGraph: {
    title: 'Weekly Intelligence Briefing | Execemy',
    description: 'Each week, our analysts release one module from the Praxis curriculum for public review.',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'}/briefing`,
    siteName: 'Execemy',
  },
}

export default async function BriefingPage() {
  const briefing = await getCurrentBriefing()

  if (!briefing) {
    notFound()
  }

  // Get module and domain metadata
  const domain = getDomainById(briefing.domainId)
  const module = getModuleById(briefing.domainId, briefing.moduleId)

  if (!domain || !module) {
    notFound()
  }

  // Get case metadata
  let caseItem = null
  try {
    caseItem = await prisma.case.findFirst({
      where: { id: briefing.caseId },
      select: {
        id: true,
        title: true,
        description: true,
      },
    })
  } catch (error) {
    console.error('Error fetching case:', error)
  }

  const stats = getCurriculumStats()

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-white">
        <SectionAccent variant="edge" />
        
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-medium text-gray-900 mb-4">
              This Week&apos;s Intelligence Briefing
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each week, our analysts release one module from the Praxis curriculum for public review. Access is complimentary.
            </p>
          </div>

          {/* Module Card */}
          <Card className="mb-8 border-gray-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {domain.title} • Module {module.number}
                  </CardDescription>
                </div>
              </div>
              {module.description && (
                <p className="text-gray-700 mt-4">{module.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Lessons ({module.lessons.length})
                </h3>
                {module.lessons.map((lesson, index) => (
                  <Link
                    key={lesson.id}
                    href={`/library/curriculum/${briefing.domainId}/${briefing.moduleId}/${lesson.id}`}
                    className="flex items-start gap-3 p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                  >
                    <BookOpen className="h-5 w-5 text-gray-400 group-hover:text-gray-900 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-gray-700">
                        {lesson.number}. {lesson.title}
                      </p>
                      {lesson.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {index === 0 ? 'Free Preview' : 'Login Required'}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Case Study Card */}
          {caseItem && (
            <Card className="mb-8 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl mb-2">Associated Case Study</CardTitle>
                <CardDescription>Practice applying the knowledge from this week&apos;s lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{caseItem.title}</h3>
                    {caseItem.description && (
                      <p className="text-sm text-gray-600 mb-4">{caseItem.description}</p>
                    )}
                  </div>
                  <Link
                    href={`/simulations/${caseItem.id}/brief`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700"
                  >
                    <PlayCircle className="h-4 w-4" />
                    View Case Briefing
                  </Link>
                  <p className="text-xs text-gray-500 mt-2">
                    Login required to access case study
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Section */}
          <div className="bg-gray-50 border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-4">
              Unlock the Full Curriculum
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              This briefing is just a preview. Get access to all {stats.totalLessons} lessons, unlimited simulations, AI-powered debriefs, and more.
            </p>
            <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
              <Link href="/pricing">View Pricing Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
