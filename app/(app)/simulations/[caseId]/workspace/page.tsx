import SimulationWorkspace from '@/components/simulation/SimulationWorkspace'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getCaseByIdWithCompetencies, listCaseFiles } from '@/lib/db/cases'
import { getSimulationByUserAndCase, createSimulation } from '@/lib/db/simulations'
import { getLessonProgressList } from '@/lib/db/progress'
import { checkSubscription } from '@/lib/auth/require-subscription'
import { getCurrentBriefing } from '@/lib/briefing'
import { notFound } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function SimulationWorkspacePage({ params }: { params: Promise<{ caseId: string }> }) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { caseId } = await params

  // Fetch case details
  const caseItem = await getCaseByIdWithCompetencies(caseId).catch(() => null)
  if (!caseItem || !caseItem.published) {
    notFound()
  }

  // Fetch case files (which contain the actual dataset data)
  const caseFiles = await listCaseFiles(caseItem.id).catch(() => [])

  // Check prerequisites
  let prerequisites: Array<{ domain: string; module: string; lesson: string; title?: string }> = []
  let prerequisiteProgress: Array<{ completed: boolean; title?: string }> = []
  let allPrerequisitesMet = true
  
  if (caseItem.prerequisites && typeof caseItem.prerequisites === 'object') {
    const prereqs = caseItem.prerequisites as any
    if (Array.isArray(prereqs)) {
      prerequisites = prereqs.filter((p: any) => p.domain && p.module && p.lesson)
      
      if (prerequisites.length > 0) {
        // Check user's progress on prerequisites
        const allProgress = await getLessonProgressList(user.id).catch(() => [])
        
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

  // Check for existing simulation or create new one
  // Use caseItem.id (UUID) instead of caseId from URL (slug)
  let simulation = await getSimulationByUserAndCase(user.id, caseItem.id).catch(() => null)

  if (!simulation) {
    try {
      simulation = await createSimulation({
        userId: user.id,
        caseId: caseItem.id, // Use UUID from database, not slug from URL
        status: 'in_progress',
        userInputs: {},
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

  // Get recommended lessons for NeedARefresher based on case competencies
  const { getDomainById, getAllLessonsFlat } = await import('@/lib/curriculum-data')
  const { getDomainIdForCompetency } = await import('@/lib/competency-mapping')

  const getFoundationalLessonForDomain = (domainId: string) => {
    const domain = getDomainById(domainId)
    if (!domain || domain.modules.length === 0) return null

    const firstModule = domain.modules[0]
    if (!firstModule || firstModule.lessons.length === 0) return null

    const firstLesson = firstModule.lessons[0]
    return {
      domain: domainId,
      module: firstModule.id,
      lesson: firstLesson.id,
      url: `/library/curriculum/${domainId}/${firstModule.id}/${firstLesson.id}`,
      title: firstLesson.title,
    }
  }

  const recommendedLessons: Array<{ domain: string; module: string; lesson: string; url: string; title: string }> = []
  const seenLessons = new Set<string>()
  const allLessons = getAllLessonsFlat()

  if (caseItem.competencies) {
    caseItem.competencies.forEach((cc: any) => {
      const competencyName = cc.competency?.name || 'Unknown'
      const domainId = getDomainIdForCompetency(competencyName)
      
      if (domainId) {
        const lesson = getFoundationalLessonForDomain(domainId)
        if (lesson) {
          const lessonKey = `${lesson.domain}-${lesson.module}-${lesson.lesson}`
          if (!seenLessons.has(lessonKey) && recommendedLessons.length < 5) {
            seenLessons.add(lessonKey)
            recommendedLessons.push(lesson)
          }
        }
      }
      
      // Also find lessons by keyword
      const keyword = competencyName.toLowerCase()
      const matchingLessons = allLessons
        .filter(l => 
          l.lessonTitle.toLowerCase().includes(keyword) ||
          l.domainTitle.toLowerCase().includes(keyword) ||
          l.moduleTitle.toLowerCase().includes(keyword)
        )
        .slice(0, 2)
      
      matchingLessons.forEach(lesson => {
        const lessonKey = `${lesson.domain}-${lesson.moduleId}-${lesson.lessonId}`
        if (!seenLessons.has(lessonKey) && recommendedLessons.length < 5) {
          seenLessons.add(lessonKey)
          recommendedLessons.push({
            domain: lesson.domain,
            module: lesson.moduleId,
            lesson: lesson.lessonId,
            url: `/library/curriculum/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`,
            title: lesson.lessonTitle,
          })
        }
      })
    })
  }

  // Check if soft paywall should be enabled
  // Enabled when: user is logged-in non-subscriber AND case is current weekly case
  const { isActive } = await checkSubscription()
  const briefing = await getCurrentBriefing()
  // Compare using metadata.caseId (slug) for briefing match
  const caseMetadata = caseItem.metadata as any
  const caseIdFromMetadata = caseMetadata?.caseId || caseItem.id
  const softPaywallEnabled = !isActive && briefing?.caseId === caseIdFromMetadata

  return (
    <div className="h-[calc(100vh-8rem)]">
      <SimulationWorkspace
        caseItem={{
          ...caseItem,
          recommendedLessons,
          files: caseFiles,
        }}
        simulation={simulation}
        userId={user.id}
        softPaywallEnabled={softPaywallEnabled}
      />
    </div>
  )
}
