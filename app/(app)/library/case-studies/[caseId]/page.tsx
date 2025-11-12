import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import MarkdownRenderer from '@/components/ui/Markdown'
import { getCurrentUser } from '@/lib/auth/get-user'
import UniversalAssetViewer from '@/components/case-study/UniversalAssetViewer'

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'
import { getCaseByIdWithCompetencies, listCaseFiles } from '@/lib/db/cases'
import { getSimulationByUserAndCase, getCompletedSimulationByUserAndCase } from '@/lib/db/simulations'
import { getLessonProgressList } from '@/lib/db/progress'
import { getCachedUserData, CacheTags } from '@/lib/cache'
import { getCachedCase } from '@/lib/case-cache'
import { getPublicAccessStatus } from '@/lib/auth/authorize'
import { upsertCaseFromJson } from '@/lib/cases/upsert-from-json'
import { AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCaseTasksUrl, getCaseStudiesUrl } from '@/lib/case-routes'
import CommunityResponses from '@/components/case-study/CommunityResponses'

export default async function CaseStudyOverviewPage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await getCurrentUser()
  const { caseId } = await params

  // Check public access status (allows null userId for anonymous users)
  const accessStatus = await getPublicAccessStatus(user?.id || null, {
    type: 'case',
    caseId,
  })

  // Handle access denial
  if (!accessStatus.access) {
    if (accessStatus.requiresLogin) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      loginUrl.searchParams.set('redirectTo', `/library/case-studies/${caseId}`)
      redirect(loginUrl.toString())
    } else {
      // Redirect to billing with return URL
      const billingUrl = new URL('/profile/billing', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      billingUrl.searchParams.set('returnUrl', `/library/case-studies/${caseId}`)
      redirect(billingUrl.toString())
    }
  }

  // If user is null but access is granted, we'll continue but some features won't work
  if (!user) {
    // This should not happen for cases (they require login), but defensive check
    const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    loginUrl.searchParams.set('redirectTo', `/library/case-studies/${caseId}`)
    redirect(loginUrl.toString())
  }

  // Cache case lookup (1 hour revalidate) - use existing helper
  let caseItem = await getCachedCase(caseId)
  if (!caseItem) {
    // Fallback if not found in cache - try database lookup
    caseItem = await getCaseByIdWithCompetencies(caseId).catch(() => null)
    
    // Check if this is a JSON case (not found in DB and exists as JSON)
    if (!caseItem) {
      const { loadInteractiveSimulation } = await import('@/lib/case-study-loader')
      const jsonCase = loadInteractiveSimulation(caseId)
      if (jsonCase) {
        // Upsert JSON case to DB
        try {
          const dbCaseId = await upsertCaseFromJson(caseId, user.id)
          // Now fetch the case from DB
          caseItem = await getCaseByIdWithCompetencies(dbCaseId).catch(() => null)
          if (!caseItem) {
            // Fallback: try by caseId slug
            caseItem = await getCaseByIdWithCompetencies(caseId).catch(() => null)
          }
        } catch (error) {
          console.error('Error upserting JSON case to DB:', error)
          // Fallback to JSON-only mode (but this should not happen)
          caseItem = {
            id: jsonCase.caseId,
            title: jsonCase.title,
            description: jsonCase.description,
            difficulty: jsonCase.difficulty,
            estimatedMinutes: jsonCase.estimatedDuration,
            published: true,
            metadata: {
              caseId: jsonCase.caseId,
              version: jsonCase.version,
            },
            competencies: jsonCase.competencies?.map((comp: string) => ({
              competency: { name: comp }
            })) || [],
            briefingDoc: jsonCase.description || '',
            datasets: null,
            prerequisites: null,
          } as any
        }
      }
    }
    
    if (!caseItem || !caseItem.published) {
      notFound()
    }
  }

  // Fetch case files for materials section
  // If case is from JSON file, extract files from JSON structure
  let caseFiles: any[] = []
  try {
    // Try to load from JSON first (for cases like cs_unit_economics_crisis)
    const { loadInteractiveSimulation } = await import('@/lib/case-study-loader')
    const jsonCase = loadInteractiveSimulation(caseId)
    if (jsonCase && jsonCase.caseFiles) {
      caseFiles = jsonCase.caseFiles.map((file: any) => ({
        id: file.fileId,
        fileName: file.fileName,
        fileType: file.fileType,
        source: file.source,
        content: file.source?.type === 'STATIC' ? file.source.content : '',
      }))
    } else {
      // Database case - fetch files normally
      caseFiles = await listCaseFiles(caseItem.id).catch(() => [])
    }
  } catch (error) {
    // Fallback to database files
    caseFiles = await listCaseFiles(caseItem.id).catch(() => [])
  }

  // Cache user case study status (5 minutes revalidate, userId in key)
  // Now all cases should have DB records after upsert, so caseItem.id is always a UUID
  const getCachedCaseStudyStatus = getCachedUserData(
    user.id,
    async () => {
      // Check if user has an in-progress case study
      // Use caseItem.id (UUID) for database lookup
      const existingCaseStudy = await getSimulationByUserAndCase(user.id, caseItem.id).catch(() => null)
      return existingCaseStudy && existingCaseStudy.status === 'in_progress' ? existingCaseStudy : null
    },
    ['case-study', 'status', caseId],
    {
      tags: [CacheTags.SIMULATIONS],
      revalidate: 300, // 5 minutes
    }
  )

  const existingCaseStudy = await getCachedCaseStudyStatus()

  // Check if user has completed this case study
  // Use caseItem.id (UUID) - now always a DB UUID after upsert
  const completedSimulation = await getCompletedSimulationByUserAndCase(user.id, caseItem.id).catch(() => null)
  const isCompleted = !!completedSimulation

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
          async () => {
            const allProgress = await getLessonProgressList(user.id).catch(() => [])
            return allProgress
          },
          ['prerequisites', 'progress', caseId],
          {
            tags: [CacheTags.USER_PROGRESS],
            revalidate: 120, // 2 minutes
          }
        )

        const allProgress = await getCachedPrerequisiteProgress()
        
        prerequisiteProgress = prerequisites.map((prereq: any) => {
          const progress = allProgress.find(
            (p: any) => p.domainId === prereq.domain &&
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
        <p className="text-sm text-gray-600">Case Study Overview</p>
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

      {/* Overview Section */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Overview</h2>
        </div>
        <div className="p-6">
          <MarkdownRenderer content={caseItem.briefingDoc || ''} />
        </div>
      </div>

      {/* Case Materials Section */}
      {(caseFiles.length > 0 || caseItem.datasets) && (
        <div className="bg-white border border-gray-200 mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Case Materials</h2>
          </div>
          <div className="p-6 min-h-[400px]">
            <UniversalAssetViewer
              briefingDoc={caseItem.briefingDoc || null}
              datasets={caseItem.datasets as any}
              caseFiles={caseFiles}
            />
          </div>
        </div>
      )}

      {/* Community Responses */}
      <CommunityResponses caseId={caseId} userId={user.id} isCompleted={isCompleted} />

      <div className="flex justify-between items-center">
        <Button asChild variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
          <Link href={getCaseStudiesUrl()}>Back to Case Studies</Link>
        </Button>
        {allPrerequisitesMet || prerequisites.length === 0 || existingCaseStudy ? (
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            <Link href={getCaseTasksUrl(caseId)}>
              {existingCaseStudy ? 'Continue Case Study' : 'Start Case Study'}
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

