import BookmarkButton from '@/components/library/BookmarkButton'
import CaseStudyCard from '@/components/library/CaseStudyCard'
import LessonDomainCompletionHandler from '@/components/library/LessonDomainCompletionHandler'
import LessonViewTracker from '@/components/library/LessonViewTracker'
import LessonKeyboardShortcuts from '@/components/library/LessonKeyboardShortcuts'
import TableOfContents from '@/components/library/TableOfContents'
import RecommendationBlock from '@/components/library/RecommendationBlock'
import KeyTakeaways from '@/components/library/KeyTakeaways'
import { getSmartRecommendations } from '@/lib/recommendation-engine'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import MarkdownRenderer from '@/components/ui/Markdown'
import { getPublicAccessStatus } from '@/lib/auth/authorize'
import { cache, CacheTags, getCachedUserData } from '@/lib/cache'
import { getAllInteractiveSimulations } from '@/lib/case-study-loader'
import { loadLessonByPathAsync } from '@/lib/content-loader'
import { getAllLessonsFlat, getCurriculumStats, getDomainById, getLessonById, getModuleById } from '@/lib/curriculum-data'
import { findArticleByStoragePath } from '@/lib/db/articles'
import { getCasesWithPrerequisites } from '@/lib/db/cases'
import { getLessonProgress } from '@/lib/db/progress'
import { fetchFromStorageServer } from '@/lib/supabase/storage'
import { ChevronLeft, ChevronRight, Clock, Info, Target } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

interface LessonPageProps {
  params: Promise<{
    domain: string
    module: string
    lesson: string
  }>
}

// Helper function to get next lesson in sequence (across modules and domains)
function getNextLessonInSequence(domainId: string, moduleId: string, lessonId: string) {
  const allLessons = getAllLessonsFlat()
  const currentIndex = allLessons.findIndex(
    l => l.domain === domainId && l.moduleId === moduleId && l.lessonId === lessonId
  )
  
  if (currentIndex === -1 || currentIndex === allLessons.length - 1) {
    return null
  }
  
  const nextLesson = allLessons[currentIndex + 1]
  return {
    domainId: nextLesson.domain,
    moduleId: nextLesson.moduleId,
    lessonId: nextLesson.lessonId
  }
}

// Helper function to get previous lesson in sequence (across modules and domains)
function getPreviousLessonInSequence(domainId: string, moduleId: string, lessonId: string) {
  const allLessons = getAllLessonsFlat()
  const currentIndex = allLessons.findIndex(
    l => l.domain === domainId && l.moduleId === moduleId && l.lessonId === lessonId
  )
  
  if (currentIndex <= 0) {
    return null
  }
  
  const previousLesson = allLessons[currentIndex - 1]
  return {
    domainId: previousLesson.domain,
    moduleId: previousLesson.moduleId,
    lessonId: previousLesson.lessonId
  }
}


export default async function LessonPage({ params }: LessonPageProps) {
  const { domain: domainId, module: moduleId, lesson: lessonId } = await params
  
  // Cache article lookup (1 hour revalidate)
  // Try multiple storage path patterns
  const getCachedArticle = cache(
    async () => {
      try {
        // Try exact pattern first: domain/module/lesson.md
        let article = await findArticleByStoragePath(`${domainId}/${moduleId}/${lessonId}.md`)
        
        // If not found, try with content/curriculum prefix
        if (!article) {
          article = await findArticleByStoragePath(`content/curriculum/${domainId}/${moduleId}/${lessonId}.md`)
        }
        
        // If still not found, try just the lesson filename
        if (!article) {
          article = await findArticleByStoragePath(`${lessonId}.md`)
        }
        
        return article
      } catch (error: any) {
        console.error('Error fetching article from database:', error)
        return null
      }
    },
    ['lesson', 'article', domainId, moduleId, lessonId],
    {
      tags: [CacheTags.ARTICLES, `lesson-${domainId}-${moduleId}-${lessonId}`],
      revalidate: 3600, // 1 hour
    }
  )

  const articleFromDb = await getCachedArticle()

  let lessonContent: string | null = null
  let lessonDuration = 12
  let lessonDifficulty = 'intermediate'
  let lessonTitle = ''
  let lessonDescription = ''

  // If found in database, fetch content from storage
  if (articleFromDb && articleFromDb.storagePath) {
    lessonTitle = articleFromDb.title
    lessonDescription = articleFromDb.description || ''
    
    const metadata = (articleFromDb.metadata || {}) as Record<string, any>
    lessonDuration = metadata.duration || 12
    lessonDifficulty = metadata.difficulty || 'intermediate'
    
    // Fetch full markdown content from Supabase Storage
    const { success, content, error } = await fetchFromStorageServer(articleFromDb.storagePath)
    
    if (success && content) {
      lessonContent = content
    } else {
      console.error('Failed to fetch from storage:', error)
      // No fallback - content must exist in storage
    }
  } else {
    // Try local file system as last resort (for development/legacy content)
    const lessonContentData = await loadLessonByPathAsync(domainId, moduleId, lessonId)
    
    if (lessonContentData && lessonContentData.content) {
      lessonContent = lessonContentData.content
      lessonDuration = lessonContentData.duration || 12
      lessonDifficulty = lessonContentData.difficulty || 'intermediate'
      lessonTitle = lessonContentData.title
      lessonDescription = lessonContentData.description
    }
  }

  // If no content found anywhere, return 404
  if (!lessonContent) {
    notFound()
  }

  // Get domain/module for breadcrumbs (try from hardcoded data first)
  const domain = getDomainById(domainId)
  const module = getModuleById(domainId, moduleId)
  const lesson = getLessonById(domainId, moduleId, lessonId)
  
  // If not in hardcoded data and no article in DB, return 404
  if (!domain || !module || !lesson) {
    if (!articleFromDb) {
      notFound()
    }
    // If article exists but not in hardcoded data, use metadata for display
    if (!lessonTitle && articleFromDb) {
      lessonTitle = articleFromDb.title
    }
  }

  const nextLesson = getNextLessonInSequence(domainId, moduleId, lessonId)
  const previousLesson = getPreviousLessonInSequence(domainId, moduleId, lessonId)
  
  // Get user info for progress tracking
  const { getCurrentUser } = await import('@/lib/auth/get-user')
  const user = await getCurrentUser()

  // Check public access status
  const accessStatus = await getPublicAccessStatus(user?.id || null, {
    type: 'lesson',
    domainId,
    moduleId,
    lessonId,
  })

  // Handle access denial
  if (!accessStatus.access) {
    if (accessStatus.requiresLogin) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      loginUrl.searchParams.set('redirectTo', `/library/curriculum/${domainId}/${moduleId}/${lessonId}`)
      redirect(loginUrl.toString())
    } else if (accessStatus.requiresUpgrade) {
      // User has subscription but needs to upgrade plan - redirect to billing with upgrade context
      const billingUrl = new URL('/profile/billing', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      billingUrl.searchParams.set('returnUrl', `/library/curriculum/${domainId}/${moduleId}/${lessonId}`)
      billingUrl.searchParams.set('upgrade', 'true')
      redirect(billingUrl.toString())
    } else {
      // Redirect to billing with return URL
      const billingUrl = new URL('/profile/billing', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      billingUrl.searchParams.set('returnUrl', `/library/curriculum/${domainId}/${moduleId}/${lessonId}`)
      redirect(billingUrl.toString())
    }
  }
  
  // Cache cases with prerequisites (15 minutes revalidate)
  const getCachedCasesWithPrerequisites = cache(
    async () => {
      try {
        return await getCasesWithPrerequisites()
      } catch (error) {
        console.error('Error checking case prerequisites:', error)
        return []
      }
    },
    ['cases', 'prerequisites'],
    {
      tags: [CacheTags.CASES],
      revalidate: 900, // 15 minutes
    }
  )

  // Get current progress if user is logged in (2 minutes revalidate, userId in key)
  let currentProgress = null
  let initialReflections: Record<string, string> = {}
  if (user) {
    const getCachedProgress = getCachedUserData(
      user.id,
      async () => {
        const progressData = await getLessonProgress(user.id, domainId, moduleId, lessonId)
        if (!progressData) {
          return { progress: null, reflections: {} }
        }
        
        // Extract reflections from lastReadPosition
        const lastReadPos = progressData.last_read_position as Record<string, any>
        let reflections: Record<string, string> = {}
        if (lastReadPos?.reflections && typeof lastReadPos.reflections === 'object') {
          reflections = lastReadPos.reflections
        }

        return {
          progress: {
            id: progressData.id,
            user_id: progressData.user_id,
            domain_id: progressData.domain_id,
            module_id: progressData.module_id,
            lesson_id: progressData.lesson_id,
            status: progressData.status,
            progress_percentage: progressData.progress_percentage,
            time_spent_seconds: progressData.time_spent_seconds,
            last_read_position: progressData.last_read_position,
            completed_at: progressData.completed_at,
            bookmarked: progressData.bookmarked,
            created_at: progressData.created_at,
            updated_at: progressData.updated_at,
          },
          reflections,
        }
      },
      ['lesson', 'progress', domainId, moduleId, lessonId],
      {
        tags: [CacheTags.USER_PROGRESS],
        revalidate: 120, // 2 minutes
      }
    )

    const { progress, reflections } = await getCachedProgress()
    currentProgress = progress
    initialReflections = reflections
  }

  // Fetch recommendations for user
  let recommendations: Array<{
    id: string
    title: string
    url: string
    type: 'lesson' | 'case-study'
    reason?: string
    domainTitle?: string
  }> = []
  
  if (user) {
    try {
      const smartRecs = await getSmartRecommendations(user.id)
      recommendations = [
        smartRecs.primary,
        ...smartRecs.alternates,
      ].filter((rec): rec is NonNullable<typeof rec> => rec !== null && rec !== undefined).map((rec) => ({
        id: rec.id,
        title: rec.title,
        url: rec.url,
        type: rec.type === 'curriculum' ? 'lesson' : 'case-study' as const,
        reason: rec.reason,
        domainTitle: rec.competencyName,
      }))
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    }
  }
  
  // Check if this is the last lesson in the module
  const isLastLessonInModule = module && lesson 
    ? module.lessons[module.lessons.length - 1]?.id === lesson.id
    : false

  // Find associated case study - only show at end of module
  let associatedCaseStudy: { 
    id: string
    title: string
    url: string
    description?: string
    competencies?: string[]
    difficulty?: string
    estimatedMinutes?: number
  } | null = null
  
  // Only find case studies if this is the last lesson in the module
  if (isLastLessonInModule) {
    // Check if any cases have this module in prerequisites (check all lessons in module)
    const casesWithPrerequisites = await getCachedCasesWithPrerequisites()
    
    for (const caseItem of casesWithPrerequisites) {
      if (caseItem.prerequisites && typeof caseItem.prerequisites === 'object') {
        const prereqs = caseItem.prerequisites as any
        if (Array.isArray(prereqs)) {
          // Check if all prerequisites for this case are in this module
          const modulePrereqs = prereqs.filter((prereq: any) => 
            prereq.domain === domainId && prereq.module === moduleId
          )
          
          // If case has prerequisites in this module, show it
          if (modulePrereqs.length > 0) {
            const caseItemWithCompetencies = caseItem as any
            associatedCaseStudy = {
              id: caseItem.id,
              title: caseItem.title,
              url: `/library/case-studies/${caseItem.id}`,
              description: caseItem.description || undefined,
              competencies: caseItemWithCompetencies.competencies?.map((cc: any) => cc.competency?.name) || [],
              difficulty: caseItem.difficulty || undefined,
              estimatedMinutes: caseItem.estimatedMinutes || undefined,
            }
            break
          }
        }
      }
    }
    
    // Fallback: use module-based matching (similar to getCaseStudyForModule)
    if (!associatedCaseStudy) {
      const allSimulations = getAllInteractiveSimulations()
      const caseMapping: Record<string, string> = {
        'capital-allocation-ceo-as-investor': 'cs_unit_economics_crisis',
        'second-order-decision-making-unit-economics-mastery': 'cs_unit_economics_crisis',
      }
    
      const caseKey = `${domainId}-${moduleId}`
      const caseId = caseMapping[caseKey]
      
      if (caseId) {
        const simulation = allSimulations.find(s => s.caseId === caseId)
        if (simulation) {
          associatedCaseStudy = {
            id: caseId,
            title: simulation.title,
            url: `/library/case-studies/${caseId}`,
            description: simulation.description,
            competencies: simulation.competencies,
            difficulty: simulation.difficulty,
            estimatedMinutes: simulation.estimatedDuration,
          }
        }
      }
      
      // Final fallback: find first case study in domain
      if (!associatedCaseStudy) {
        const domainCases = allSimulations.filter(s => {
          if (domainId.includes('second-order') && s.caseId.includes('unit_economics')) return true
          if (domainId.includes('competitive') && s.caseId.includes('asymmetric')) return true
          return false
        })
        
        if (domainCases.length > 0) {
          const caseStudy = domainCases[0]
          associatedCaseStudy = {
            id: caseStudy.caseId,
            title: caseStudy.title,
            url: `/library/case-studies/${caseStudy.caseId}`,
            description: caseStudy.description,
            competencies: caseStudy.competencies,
            difficulty: caseStudy.difficulty,
            estimatedMinutes: caseStudy.estimatedDuration,
          }
        }
      }
    }
  }

  // Use article title or fall back to lesson title
  const displayTitle = lessonTitle || (lesson ? lesson.title : 'Untitled Lesson')
  const displayModuleNumber = lesson ? lesson.number : 1
  const displayModuleTitle = module ? module.title : 'Module'
  const displayDomainTitle = domain ? domain.title : 'Domain'

  const stats = getCurriculumStats()

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Public Access Banner */}
      {accessStatus.isPublic && (
        <Alert className="border-gray-300 bg-gray-50 m-0 rounded-none">
          <Info className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-700">
            You are viewing content from this week&apos;s Intelligence Briefing.{' '}
            <Link href="/pricing" className="underline font-medium hover:text-gray-900">
              Unlock all {stats.totalLessons} lessons
            </Link>
            {' '}with a Praxis subscription.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Desktop Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
          <div className="px-6 py-4 pb-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4 uppercase tracking-wide">
              <Link href="/library/curriculum" className="hover:text-neutral-700 font-medium">
                DOMAINS
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/library/curriculum/${domainId}`} className="hover:text-neutral-700 font-medium">
                {displayDomainTitle}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-neutral-700 font-medium">{displayModuleTitle}</span>
            </div>

            {/* Progress Bar */}
            {user && currentProgress && currentProgress.progress_percentage > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                  <span>Progress</span>
                  <span>{currentProgress.progress_percentage}%</span>
                </div>
                <Progress value={currentProgress.progress_percentage} className="h-1" />
              </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-neutral-500 font-mono">
                    {String(module?.number || displayModuleNumber).padStart(2, '0')}.{String(lesson?.number || 1).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{lessonDuration} MIN</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{lessonDifficulty.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                {user && (
                  <BookmarkButton
                    domainId={domainId}
                    moduleId={moduleId}
                    lessonId={lessonId}
                    initialBookmarked={currentProgress?.bookmarked || false}
                  />
                )}
              </div>
              <h1 className="text-xl font-semibold leading-tight text-neutral-900">{displayTitle}</h1>
            </div>
          </div>

        </div>

        {/* Content - Two Column Layout */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full px-4 py-4 md:px-6 md:py-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
              {/* Main Content */}
              <div className="prose prose-neutral max-w-none">
                <MarkdownRenderer 
                  content={lessonContent}
                  lessonId={lessonId}
                  domainId={domainId}
                  moduleId={moduleId}
                  initialReflections={initialReflections}
                />
            
                {/* Put Your Knowledge to the Test - Only show at end of module */}
                {isLastLessonInModule && associatedCaseStudy && (
                  <div className="mt-12 pt-12 border-t border-neutral-200">
                    <div className="mb-6">
                      <h2 className="text-2xl font-light text-neutral-900 tracking-tight mb-2">
                        Apply in Case Study
                      </h2>
                      <p className="text-neutral-600">
                        Put your knowledge to the test with a real-world scenario
                      </p>
                    </div>
                    <CaseStudyCard
                      caseId={associatedCaseStudy.id}
                      title={associatedCaseStudy.title}
                      url={associatedCaseStudy.url}
                      description={associatedCaseStudy.description}
                      competencies={associatedCaseStudy.competencies}
                      difficulty={associatedCaseStudy.difficulty}
                      duration={associatedCaseStudy.estimatedMinutes}
                    />
                  </div>
                )}
            
                {/* Analytics Tracking */}
                {user && (
                  <>
                    <LessonKeyboardShortcuts
                      nextLessonUrl={nextLesson ? `/library/curriculum/${nextLesson.domainId}/${nextLesson.moduleId}/${nextLesson.lessonId}` : null}
                      prevLessonUrl={previousLesson ? `/library/curriculum/${previousLesson.domainId}/${previousLesson.moduleId}/${previousLesson.lessonId}` : null}
                    />
                    <LessonViewTracker
                      lessonId={lessonId}
                      domainId={domainId}
                      moduleId={moduleId}
                      userId={user.id}
                    />
                  </>
                )}

                {/* Progress Tracker with Domain Completion Handler */}
                {user && (
                  <LessonDomainCompletionHandler
                    userId={user.id}
                    domainId={domainId}
                    moduleId={moduleId}
                    lessonId={lessonId}
                    domainTitle={displayDomainTitle}
                    initialProgress={currentProgress?.progress_percentage || 0}
                    initialStatus={(currentProgress?.status as 'not_started' | 'in_progress' | 'completed') || 'not_started'}
                    initialTimeSpent={currentProgress?.time_spent_seconds || 0}
                    initialScrollPosition={currentProgress?.last_read_position?.scrollTop}
                  />
                )}

                {/* Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 mt-8 border-t border-neutral-200 gap-4">
                  <Button variant="outline" size="sm" asChild className="h-8 px-2.5 border-gray-300 hover:border-gray-400 rounded-none text-xs uppercase tracking-wide">
                    <Link href={`/library/curriculum/${domainId}/${moduleId}`}>
                      <ChevronLeft className="mr-2 h-3 w-3" />
                      MODULE
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    {previousLesson ? (
                      <Button variant="outline" size="sm" asChild className="h-8 px-2.5 border-gray-300 hover:border-gray-400 rounded-none text-xs uppercase tracking-wide">
                        <Link href={`/library/curriculum/${previousLesson.domainId}/${previousLesson.moduleId}/${previousLesson.lessonId}`}>
                          <ChevronLeft className="mr-2 h-3 w-3" />
                          PREVIOUS
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="h-8 px-2.5 border-gray-200 text-gray-400 rounded-none text-xs uppercase tracking-wide">
                        <ChevronLeft className="mr-2 h-3 w-3" />
                        PREVIOUS
                      </Button>
                    )}
                    
                    {nextLesson ? (
                      <Button size="sm" asChild className="h-8 px-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-none text-xs uppercase tracking-wide">
                        <Link href={`/library/curriculum/${nextLesson.domainId}/${nextLesson.moduleId}/${nextLesson.lessonId}`}>
                          NEXT
                          <ChevronRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" disabled className="h-8 px-2.5 bg-gray-400 text-white rounded-none text-xs uppercase tracking-wide">
                        NEXT
                        <ChevronRight className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Rail - Sticky Key Takeaways, TOC and Recommendations */}
              <div className="hidden lg:block">
                <div className="sticky top-24 max-h-[calc(100vh-var(--header-h)-8rem)] overflow-y-auto space-y-8">
                  <KeyTakeaways content={lessonContent} />
                  <TableOfContents content={lessonContent} />
                  {recommendations.length > 0 && (
                    <RecommendationBlock recommendations={recommendations} maxItems={3} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
