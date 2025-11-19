import { getUserResidency } from '@/lib/auth/get-residency'
import { cache, CacheTags } from '@/lib/cache'
import { getAllInteractiveSimulations } from '@/lib/case-study-loader'
import { getDisplayNameForCompetency, getDomainForCompetency } from '@/lib/competency-mapping'
import { ContentCollection, createThemedCollections, getModuleCollections } from '@/lib/content-collections'
import { completeCurriculumData, getAllLessonsFlat, getDomainById } from '@/lib/curriculum-data'
import { getUserAggregateScores } from '@/lib/db/debriefs'
import { getResidencyArticles } from '@/lib/db/articles'
import { getRecentCases } from '@/lib/db/cases'
import { getRecentArticles } from '@/lib/db/articles'
import { getCompletedArticleIds, getRecentCompletedArticles, getArticleProgressCompletionDates } from '@/lib/db/articleProgress'
import { getCompletedSimulationsForDashboard, getInProgressSimulationsForDashboard, getAllSimulationsForDashboard, getCompletedSimulationsByCaseIds, getPopularSimulations } from '@/lib/db/simulations'
import { getInProgressLessonsForDashboard, getLessonProgressSummary, getPopularLessons, getAllUserProgress } from '@/lib/db/progress'
import { dbCall } from '@/lib/db/utils'
import { getAllLearningPaths } from '@/lib/learning-paths'
import { getSmartRecommendations, RecommendationWithAlternates } from '@/lib/recommendation-engine'

// Cache residency articles count (shared data, changes when articles are published/unpublished)
const getCachedResidencyArticles = (residencyYear: number) => cache(
  async () => {
    try {
      return await getResidencyArticles(residencyYear)
    } catch (error: any) {
      // On error, return empty array
      console.error('Error fetching residency articles:', error)
      return []
    }
  },
  ['residency-articles', residencyYear.toString()],
  {
    tags: [CacheTags.ARTICLES, 'residency-articles'],
    revalidate: 3600, // 1 hour
  }
)()

export interface DashboardData {
  recommendation: RecommendationWithAlternates
  residencyData: {
    year: number
    title: string
    articlesCompleted: number
    totalArticles: number
    simulationsCompleted: number
    totalSimulations: number
  } | null
  currentStreak: number
  longestStreak: number
  weeklyGoal: {
    targetHours: number
    currentHours: number
    progress: number
  }
  latestKeyInsight: string | null
  learningTrack: string | null
  recentActivities: Array<{
    id: string
    type: 'article' | 'simulation'
    title: string
    completedAt: string
    competency?: string
  }>
  aggregateScores: Record<string, number> | null
  jumpBackInItems: Array<{ type: 'lesson' | 'simulation'; id: string; title: string; url: string; progress?: number }>
  strengthenCoreShelves: Array<{
    competencyName: string
    competencyKey: string
    domainId: string
    lessons: Array<{ id: string; title: string; url: string; moduleTitle: string; domainTitle?: string }>
    cases: Array<{ id: string; title: string; url: string }>
  }>
  newContent: Array<{ type: 'lesson' | 'case'; id: string; title: string; url: string; createdAt: Date }>
  popularContent: Array<{ type: 'lesson' | 'case'; id: string; title: string; url: string; moduleTitle?: string; domainTitle?: string }>
  practiceSpotlight: Array<{ type: 'case' | 'lesson'; id: string; title: string; url: string; reason?: string }>
  continueYearPath: Array<{ type: 'lesson' | 'case'; id: string; title: string; url: string; moduleTitle?: string; domainTitle?: string }>
  themedCollections: ContentCollection[]
  moduleCollections: ContentCollection[]
  learningPaths: Array<{
    id: string
    title: string
    description?: string
    duration: string
    items: any[]
    progress?: {
      completed: number
      total: number
      percentage: number
    }
  }>
  domainCompletions: Array<{
    domainId: string
    domainTitle: string
    completed: boolean
    progress: number
  }>
  roadmap: {
    totalLessons: number
    completedCount: number
    nextLesson: {
      domainId: string
      moduleId: string
      lessonId: string
      title: string
      url: string
    } | null
    sections: Array<{
      domainId: string
      domainTitle: string
      modules: Array<{
        moduleId: string
        moduleTitle: string
        moduleNumber: number
        lessons: Array<{
          lessonId: string
          lessonTitle: string
          lessonNumber: number
          status: 'completed' | 'in_progress' | 'not_started'
          url: string
        }>
      }>
    }>
  }
}

/**
 * Assembles all dashboard shelf data for a user
 * This is the single source of truth for dashboard data assembly
 * 
 * Performance optimized: Parallel queries + cached curriculum data
 */
export async function assembleDashboardData(userId: string): Promise<DashboardData> {
  // Load curriculum data once (cached in memory)
  const allLessons = getAllLessonsFlat()
  const allSimulations = getAllInteractiveSimulations()

  // Parallel fetch: Get user residency and base user data in parallel
  const [residencyResult, aggregateScores, recommendation] = await Promise.allSettled([
    getUserResidency(userId).catch(() => ({ currentResidency: null })),
    getUserAggregateScores(userId).catch(() => null),
    getSmartRecommendations(userId).catch(() => ({ primary: null, alternates: [] } as RecommendationWithAlternates)),
  ])

  const currentResidency = residencyResult.status === 'fulfilled' ? residencyResult.value.currentResidency : null
  const aggregateScoresResult = aggregateScores.status === 'fulfilled' ? aggregateScores.value : null
  const recommendationResult = recommendation.status === 'fulfilled' ? recommendation.value : ({ primary: null, alternates: [] } as RecommendationWithAlternates)

  // Parallel fetch: Get all user progress data at once
  const [
    residencyArticlesResult,
    completedArticlesResult,
    completedSimulationsResult,
    inProgressLessonsResult,
    inProgressSimulationsResult,
    userProgressResult,
    recentArticlesResult,
    recentSimulationsResult,
    allProgressResult,
    popularLessonsResult,
    popularSimulationsResult,
    latestCasesResult,
    latestArticlesResult,
  ] = await Promise.allSettled([
    currentResidency ? getCachedResidencyArticles(currentResidency) : Promise.resolve([]),
    getCompletedArticleIds(userId),
    getCompletedSimulationsForDashboard(userId),
    getInProgressLessonsForDashboard(userId),
    getInProgressSimulationsForDashboard(userId),
    getLessonProgressSummary(userId),
    getRecentCompletedArticles(userId),
    getAllSimulationsForDashboard(userId),
    getArticleProgressCompletionDates(userId),
    getPopularLessons(),
    getPopularSimulations(),
    getRecentCases(),
    getRecentArticles(),
  ])

  // Extract results with fallbacks
  const articles = residencyArticlesResult.status === 'fulfilled' ? residencyArticlesResult.value : []
  const completedArticles = completedArticlesResult.status === 'fulfilled' ? completedArticlesResult.value : []
  const completedSimulations = completedSimulationsResult.status === 'fulfilled' ? completedSimulationsResult.value : []
  const inProgressLessons = inProgressLessonsResult.status === 'fulfilled' ? inProgressLessonsResult.value : []
  const inProgressSimulations = inProgressSimulationsResult.status === 'fulfilled' ? inProgressSimulationsResult.value : []
  const userProgress = userProgressResult.status === 'fulfilled' ? userProgressResult.value : []
  const recentArticles = recentArticlesResult.status === 'fulfilled' ? recentArticlesResult.value : []
  const recentSimulations = recentSimulationsResult.status === 'fulfilled' ? recentSimulationsResult.value : []
  const allProgress = allProgressResult.status === 'fulfilled' ? allProgressResult.value : []
  const popularLessons = popularLessonsResult.status === 'fulfilled' ? popularLessonsResult.value : []
  const popularSimulations = popularSimulationsResult.status === 'fulfilled' ? popularSimulationsResult.value : []
  const latestCases = latestCasesResult.status === 'fulfilled' ? latestCasesResult.value : []
  const latestArticles = latestArticlesResult.status === 'fulfilled' ? latestArticlesResult.value : []

  // Process residency data
  let residencyData: DashboardData['residencyData'] = null
  if (currentResidency && articles.length > 0) {
    const completedArticleIds = new Set(completedArticles.map((a) => a.articleId))
    const articlesCompleted = articles.filter((a: { id: string }) => completedArticleIds.has(a.id)).length
    residencyData = {
      year: currentResidency,
      title: `Year ${currentResidency}: ${currentResidency === 1 ? 'The Operator\'s Residency' : 'Business Acumen Core'}`,
      articlesCompleted,
      totalArticles: articles.length,
      simulationsCompleted: completedSimulations.length,
      totalSimulations: 10, // Placeholder - should be dynamic
    }
  }

  // Jump Back In: Get up to 5 in-progress items, sorted by most recent update
  // Show exact last position using lastReadPosition for lessons
  let jumpBackInItems: DashboardData['jumpBackInItems'] = []
  try {
    // Get lessons with their last read positions, sorted by most recent update
    const lessonItems = inProgressLessons
      .map(progress => {
        const lesson = allLessons.find(
          l => l.domain === progress.domainId &&
               l.moduleId === progress.moduleId &&
               l.lessonId === progress.lessonId
        )
        if (!lesson) return null

        // Extract scroll position if available
        const lastReadPos = progress.lastReadPosition as Record<string, any> | undefined
        const hasPosition = lastReadPos && typeof lastReadPos.scrollTop === 'number'

        return {
          type: 'lesson' as const,
          id: `${progress.domainId}-${progress.moduleId}-${progress.lessonId}`,
          title: lesson.lessonTitle,
          url: `/library/curriculum/${progress.domainId}/${progress.moduleId}/${progress.lessonId}`,
          progress: progress.progressPercentage,
          updatedAt: progress.updatedAt,
          hasPosition,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)

    // Get simulations, sorted by most recent update
    const simulationItems = inProgressSimulations
      .map(sim => ({
        type: 'simulation' as const,
        id: sim.id,
        title: sim.case.title,
        url: `/case-studies/${sim.case.id}`,
        updatedAt: sim.updatedAt,
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    // Merge and prioritize lessons with saved positions, then most recent items
    const allItems = [
      ...lessonItems.filter(item => item.hasPosition),
      ...simulationItems,
      ...lessonItems.filter(item => !item.hasPosition),
    ]
      .slice(0, 5)
      .map(item => ({
        type: item.type,
        id: item.id,
        title: item.title,
        url: item.url,
        progress: item.type === 'lesson' ? item.progress : undefined,
      }))

    jumpBackInItems = allItems
  } catch (error) {
    console.error('Error processing jump back in:', error)
  }

  // Strengthen Core: Get 1-2 weakest competencies, prioritize foundational lessons
  let strengthenCoreShelves: DashboardData['strengthenCoreShelves'] = []
  try {
    if (aggregateScoresResult) {
      const weakCompetencies = Object.entries(aggregateScoresResult)
        .filter(([_, score]) => score > 0)
        .sort(([_, a], [__, b]) => a - b)
        .slice(0, 2)

      // Get completed lesson IDs to filter out already completed lessons
      const completedLessonIds = new Set(
        userProgress
          .filter(p => p.status === 'completed')
          .map(p => `${p.domainId}-${p.moduleId}-${p.lessonId}`)
      )

      for (const [competencyKey, score] of weakCompetencies) {
        const domainId = getDomainForCompetency(competencyKey)
        if (domainId) {
          const domain = getDomainById(domainId)
          if (domain) {
            // Prioritize foundational lessons: first module, first few lessons
            const foundationalLessons: Array<{
              id: string
              title: string
              url: string
              moduleTitle: string
              domainTitle?: string
              isFoundational: boolean
              moduleNumber: number
              lessonNumber: number
            }> = []

            // Get first module's lessons (foundational)
            if (domain.modules.length > 0) {
              const firstModule = domain.modules[0]
              for (const lesson of firstModule.lessons.slice(0, 3)) {
                const lessonId = `${domainId}-${firstModule.id}-${lesson.id}`
                if (!completedLessonIds.has(lessonId)) {
                  foundationalLessons.push({
                    id: lessonId,
                    title: lesson.title,
                    url: `/library/curriculum/${domainId}/${firstModule.id}/${lesson.id}`,
                    moduleTitle: firstModule.title,
                    domainTitle: domain.title,
                    isFoundational: true,
                    moduleNumber: firstModule.number,
                    lessonNumber: lesson.number,
                  })
                }
              }
            }

            // Add other lessons from the domain (up to 8 total)
            const otherDomainLessons = allLessons
              .filter(l => {
                const lessonId = `${l.domain}-${l.moduleId}-${l.lessonId}`
                return l.domain === domainId && !completedLessonIds.has(lessonId)
              })
              .filter(l => {
                // Exclude foundational lessons already added
                const lessonId = `${l.domain}-${l.moduleId}-${l.lessonId}`
                return !foundationalLessons.some(fl => fl.id === lessonId)
              })
              .sort((a, b) => {
                // Sort by module number, then lesson number
                if (a.moduleNumber !== b.moduleNumber) {
                  return a.moduleNumber - b.moduleNumber
                }
                return a.lessonNumber - b.lessonNumber
              })
              .slice(0, 8 - foundationalLessons.length)
              .map(l => ({
                id: `${l.domain}-${l.moduleId}-${l.lessonId}`,
                title: l.lessonTitle,
                url: `/library/curriculum/${l.domain}/${l.moduleId}/${l.lessonId}`,
                moduleTitle: l.moduleTitle,
                domainTitle: l.domainTitle,
                isFoundational: false,
                moduleNumber: l.moduleNumber,
                lessonNumber: l.lessonNumber,
              }))

            // Combine: foundational first, then others
            const domainLessons = [
              ...foundationalLessons,
              ...otherDomainLessons,
            ]
              .slice(0, 8)
              .map(l => ({
                id: l.id,
                title: l.title,
                url: l.url,
                moduleTitle: l.moduleTitle,
                domainTitle: l.domainTitle,
              }))

            // Get related cases (same domain matching logic)
            const domainCases = allSimulations
              .filter(s => {
                if (domainId.includes('second-order') && s.caseId.includes('unit_economics')) return true
                if (domainId.includes('competitive') && s.caseId.includes('asymmetric')) return true
                if (domainId.includes('crisis') && (s.caseId.includes('crisis') || s.caseId.includes('tesla') || s.caseId.includes('airbnb'))) return true
                if (domainId.includes('market') && (s.caseId.includes('market') || s.caseId.includes('tech'))) return true
                if (domainId.includes('organizational') && (s.caseId.includes('talent') || s.caseId.includes('org'))) return true
                return false
              })
              .slice(0, 3)
              .map(s => ({
                id: s.caseId,
                title: s.title,
                url: `/case-studies/${s.caseId}`,
              }))

            if (domainLessons.length > 0 || domainCases.length > 0) {
              strengthenCoreShelves.push({
                competencyName: getDisplayNameForCompetency(competencyKey),
                competencyKey,
                domainId,
                lessons: domainLessons,
                cases: domainCases,
              })
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching strengthen core data:', error)
  }

  // Practice Spotlight: Case-first rail aligned to recent modules
  let practiceSpotlight: DashboardData['practiceSpotlight'] = []
  try {
    const recentlyCompletedLessons = userProgress.filter(p => p.status === 'completed')
      .sort((a, b) => (b as any).completedAt?.getTime() || 0 - (a as any).completedAt?.getTime() || 0)
      .slice(0, 10)

    const recentDomains = new Set<string>()
    recentlyCompletedLessons.forEach(p => {
      if (p.domainId) recentDomains.add(p.domainId)
    })

    for (const domainId of Array.from(recentDomains).slice(0, 2)) {
      const domainCases = allSimulations.filter(s => {
        if (domainId.includes('second-order') && s.caseId.includes('unit_economics')) return true
        if (domainId.includes('competitive') && s.caseId.includes('asymmetric')) return true
        if (domainId.includes('crisis') && (s.caseId.includes('crisis') || s.caseId.includes('tesla') || s.caseId.includes('airbnb'))) return true
        if (domainId.includes('market') && (s.caseId.includes('market') || s.caseId.includes('tech'))) return true
        if (domainId.includes('organizational') && (s.caseId.includes('talent') || s.caseId.includes('org'))) return true
        return false
      })

      domainCases.slice(0, 2).forEach(c => {
        if (practiceSpotlight.length < 6) {
          practiceSpotlight.push({
            type: 'case',
            id: c.caseId,
            title: c.title,
            url: `/case-studies/${c.caseId}`,
            reason: 'Apply what you\'ve learned',
          })
        }
      })
    }

    if (practiceSpotlight.length < 6) {
      for (const domainId of Array.from(recentDomains)) {
        const domainLessons = allLessons
          .filter(l => l.domain === domainId)
          .slice(0, 3)
        
        for (const lesson of domainLessons) {
          if (practiceSpotlight.length >= 6) break
          const lessonId = `${lesson.domain}-${lesson.moduleId}-${lesson.lessonId}`
          if (!practiceSpotlight.some(item => item.id === lessonId)) {
            practiceSpotlight.push({
              type: 'lesson',
              id: lessonId,
              title: lesson.lessonTitle,
              url: `/library/curriculum/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`,
              reason: 'Strengthen your understanding',
            })
          }
        }
        if (practiceSpotlight.length >= 6) break
      }
    }

    practiceSpotlight = practiceSpotlight.slice(0, 6)
  } catch (error) {
    console.error('Error fetching practice spotlight:', error)
  }

  // Continue Your Year Path
  let continueYearPath: DashboardData['continueYearPath'] = []
  try {
    if (currentResidency) {
      const completedLessons = new Set(
        userProgress
          .filter(p => p.status === 'completed')
          .map(p => `${p.domainId}-${p.moduleId}-${p.lessonId}`)
      )

      const yearPathLessons = allLessons
        .filter(lesson => {
          const lessonId = `${lesson.domain}-${lesson.moduleId}-${lesson.lessonId}`
          return !completedLessons.has(lessonId)
        })
        .slice(0, 6)

      continueYearPath = yearPathLessons.map(lesson => ({
        type: 'lesson' as const,
        id: `${lesson.domain}-${lesson.moduleId}-${lesson.lessonId}`,
        title: lesson.lessonTitle,
        url: `/library/curriculum/${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`,
        moduleTitle: lesson.moduleTitle,
        domainTitle: lesson.domainTitle,
      }))
    }
  } catch (error) {
    console.error('Error fetching continue year path:', error)
  }

  // New on Execemy: Latest articles and case studies
  let newContent: DashboardData['newContent'] = []
  try {
    const articleLessons = latestArticles
      .map(article => {
        const matchingLesson = allLessons.find(l => 
          article.storagePath?.includes(l.lessonId) || 
          article.id === l.lessonId
        )
        if (matchingLesson) {
          return {
            type: 'lesson' as const,
            id: `${matchingLesson.domain}-${matchingLesson.moduleId}-${matchingLesson.lessonId}`,
            title: article.title,
            url: `/library/curriculum/${matchingLesson.domain}/${matchingLesson.moduleId}/${matchingLesson.lessonId}`,
            createdAt: article.createdAt,
          }
        }
        return null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
    
    newContent = [
      ...latestCases.map(c => ({
        type: 'case' as const,
        id: c.id,
        title: c.title,
        url: `/case-studies/${c.id}`,
        createdAt: c.createdAt,
      })),
      ...articleLessons,
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 7)
  } catch (error) {
    console.error('Error processing new content:', error)
  }

  // Popular Now: Most completed content
  let popularContent: DashboardData['popularContent'] = []
  try {
    for (const popLesson of popularLessons) {
      const lesson = allLessons.find(
        l => l.domain === popLesson.domainId &&
             l.moduleId === popLesson.moduleId &&
             l.lessonId === popLesson.lessonId
      )
      if (lesson && popularContent.length < 8) {
        popularContent.push({
          type: 'lesson',
          id: `${popLesson.domainId}-${popLesson.moduleId}-${popLesson.lessonId}`,
          title: lesson.lessonTitle,
          url: `/library/curriculum/${popLesson.domainId}/${popLesson.moduleId}/${popLesson.lessonId}`,
          moduleTitle: lesson.moduleTitle,
          domainTitle: lesson.domainTitle,
        })
      }
    }

    for (const popSim of popularSimulations) {
      const simulation = allSimulations.find(s => s.caseId === popSim.caseId)
      if (simulation && popularContent.length < 10) {
        popularContent.push({
          type: 'case',
          id: popSim.caseId,
          title: simulation.title,
          url: `/case-studies/${popSim.caseId}`,
        })
      }
    }

    popularContent = popularContent.slice(0, 8)
  } catch (error) {
    console.error('Error processing popular content:', error)
  }

  // Get user's completed content IDs for filtering
  const userCompletedIds = new Set<string>()
  try {
    userProgress.filter(p => p.status === 'completed').forEach(p => {
      userCompletedIds.add(`${p.domainId}-${p.moduleId}-${p.lessonId}`)
    })
  } catch (error) {
    console.error('Error processing user completed IDs:', error)
  }

  // Create themed collections
  let themedCollections: ContentCollection[] = []
  try {
    themedCollections = createThemedCollections(userCompletedIds)
  } catch (error) {
    console.error('Error creating themed collections:', error)
  }

  // Get module collections
  let moduleCollections: ContentCollection[] = []
  try {
    moduleCollections = getModuleCollections(3)
  } catch (error) {
    console.error('Error getting module collections:', error)
  }

  // Get domain completions for residency progress visualization
  let domainCompletions: Array<{
    domainId: string
    domainTitle: string
    completed: boolean
    progress: number
  }> = []
  try {
    const { getUserDomainCompletions, getDomainProgress } = await import('./progress-tracking')
    const completedDomains = await getUserDomainCompletions(userId)
    const completedDomainIds = new Set(completedDomains.map(d => d.domainId))

    // Get all domains and their progress
    const allDomains = completeCurriculumData
    const domainProgressPromises = allDomains.map(async (domain) => {
      const progress = await getDomainProgress(userId, domain.id, domain.modules.reduce((sum, m) => sum + m.lessons.length, 0))
      return {
        domainId: domain.id,
        domainTitle: domain.title,
        completed: completedDomainIds.has(domain.id),
        progress: progress.completionPercentage,
      }
    })
    domainCompletions = await Promise.all(domainProgressPromises)
  } catch (error) {
    console.error('Error fetching domain completions:', error)
  }

  // Get learning paths with user progress - OPTIMIZED: Batch all simulation queries
  let learningPaths: DashboardData['learningPaths'] = []
  try {
    const allPaths = await getAllLearningPaths()
    const lessonProgress = userProgress.filter(p => p.status === 'completed')
    
    // Get all case IDs we need to check
    const caseIdsToCheck = new Set<string>()
    allPaths.slice(0, 6).forEach(path => {
      path.items.forEach(item => {
        if (item.type === 'case' && item.caseId) {
          caseIdsToCheck.add(item.caseId)
        }
      })
    })

    // Batch query: Get all completed simulations for relevant cases in one query
    const completedCaseSimulations = await getCompletedSimulationsByCaseIds(userId, Array.from(caseIdsToCheck))
    
    const completedCaseIds = new Set(completedCaseSimulations.map(s => s.caseId))

    learningPaths = allPaths.slice(0, 6).map(path => {
      let completedCount = 0
      const totalItems = path.items.length

      for (const item of path.items) {
        if (item.type === 'lesson') {
          const progress = lessonProgress.find(
            p => p.domainId === item.domain &&
                 p.moduleId === item.module &&
                 p.lessonId === item.lesson
          )
          if (progress) {
            completedCount++
          }
        } else if (item.type === 'case' && item.caseId) {
          if (completedCaseIds.has(item.caseId)) {
            completedCount++
          }
        }
      }

      return {
        ...path,
        progress: {
          completed: completedCount,
          total: totalItems,
          percentage: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
        },
      }
    })
  } catch (error) {
    console.error('Error fetching learning paths:', error)
  }

  // Process recent activities
  const recentActivities = [
    ...(recentArticles || []).map((a) => ({
      id: a.article.id,
      type: 'article' as const,
      title: a.article.title,
      completedAt: a.completedAt?.toISOString() || '',
      competency: a.article.competency?.name,
    })),
    ...(recentSimulations || []).map((s) => ({
      id: s.id,
      type: 'simulation' as const,
      title: s.case.title,
      completedAt: s.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)

  // Build curriculum roadmap: scan entire curriculum in order, find next lesson
  let roadmap: DashboardData['roadmap'] = {
    totalLessons: 0,
    completedCount: 0,
    nextLesson: null,
    sections: [],
  }
  try {
    const completedLessonIds = new Set(
      userProgress
        .filter(p => p.status === 'completed')
        .map(p => `${p.domainId}:${p.moduleId}:${p.lessonId}`)
    )
    const inProgressLessonIds = new Set(
      userProgress
        .filter(p => p.status === 'in_progress')
        .map(p => `${p.domainId}:${p.moduleId}:${p.lessonId}`)
    )

    let totalLessons = 0
    let completedCount = 0
    let nextLessonFound = false

    const sections = completeCurriculumData.map(domain => {
      const domainModules = domain.modules
        .sort((a, b) => a.number - b.number)
        .map(module => {
          const moduleLessons = module.lessons
            .sort((a, b) => a.number - b.number)
            .map(lesson => {
              totalLessons++
              const lessonKey = `${domain.id}:${module.id}:${lesson.id}`
              let status: 'completed' | 'in_progress' | 'not_started' = 'not_started'
              
              if (completedLessonIds.has(lessonKey)) {
                status = 'completed'
                completedCount++
              } else if (inProgressLessonIds.has(lessonKey)) {
                status = 'in_progress'
              }

              // Find next lesson (first not completed, in order)
              if (!nextLessonFound && status !== 'completed') {
                nextLessonFound = true
                roadmap.nextLesson = {
                  domainId: domain.id,
                  moduleId: module.id,
                  lessonId: lesson.id,
                  title: lesson.title,
                  url: `/library/curriculum/${domain.id}/${module.id}/${lesson.id}`,
                }
              }

              return {
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                lessonNumber: lesson.number,
                status,
                url: `/library/curriculum/${domain.id}/${module.id}/${lesson.id}`,
              }
            })

          return {
            moduleId: module.id,
            moduleTitle: module.title,
            moduleNumber: module.number,
            lessons: moduleLessons,
          }
        })

      return {
        domainId: domain.id,
        domainTitle: domain.title,
        modules: domainModules,
      }
    })

    roadmap = {
      totalLessons,
      completedCount,
      nextLesson: roadmap.nextLesson,
      sections,
    }
  } catch (error) {
    console.error('Error building roadmap:', error)
  }

  // Get profile to extract weekly goal and learning track
  const profile = await dbCall(async (prisma) => {
    // Try with optional fields first
    try {
      return await prisma.profile.findUnique({
        where: { id: userId },
        select: { 
          bio: true,
          weeklyTargetHours: true,
          learningTrack: true,
        } as any,
      })
    } catch (error: any) {
      // If columns don't exist, retry with basic fields only
      const { isColumnNotFoundError } = await import('@/lib/db/utils')
      if (isColumnNotFoundError(error)) {
        return await prisma.profile.findUnique({
          where: { id: userId },
          select: { 
            bio: true,
          },
        })
      }
      throw error
    }
  }).catch(() => null)

  // Use weeklyTargetHours from profile, fallback to parsing bio, then default to 2
  let weeklyGoalHours = 2 // Default
  if (profile && 'weeklyTargetHours' in profile && profile.weeklyTargetHours) {
    weeklyGoalHours = profile.weeklyTargetHours
  } else if (profile?.bio) {
    const match = profile.bio.match(/Weekly commitment:\s*(\d+)\s*hours?/i)
    if (match) {
      weeklyGoalHours = parseInt(match[1], 10) || 2
    }
  }

  // Calculate weekly progress (time spent this week) using lesson progress (authoritative for time)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (now.getDay() || 7) + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)

  let weeklyTimeSpent = 0
  try {
    const allUserProgressMap = await getAllUserProgress(userId)
    for (const progress of Array.from(allUserProgressMap.values())) {
      const updatedAt = new Date(progress.updated_at)
      if (updatedAt >= weekStart) {
        weeklyTimeSpent += progress.time_spent_seconds || 0
      }
    }
  } catch (error) {
    // Best-effort; if this fails, weeklyTimeSpent remains 0
    console.error('Error calculating weekly time spent:', error)
  }

  const weeklyGoal = {
    targetHours: weeklyGoalHours,
    currentHours: Math.round(weeklyTimeSpent / 3600 * 10) / 10, // Round to 1 decimal
    progress: Math.min(100, Math.round((weeklyTimeSpent / 3600 / weeklyGoalHours) * 100)),
  }

  // Get latest key insight from most recent completed debrief
  let latestKeyInsight: string | null = null
  try {
    const { listDebriefsByUser } = await import('@/lib/db/debriefs')
    const debriefs = await listDebriefsByUser(userId)
    if (debriefs.length > 0) {
      const latestDebrief = debriefs[0] // Already sorted by createdAt desc
      const summaryText = latestDebrief.summaryText || ''
      // Extract first sentence as key insight
      latestKeyInsight = summaryText.split('.')[0] + '.' || null
    }
  } catch (error) {
    // Best-effort; if this fails, latestKeyInsight remains null
    console.error('Error fetching latest key insight:', error)
  }

  // Calculate learning streak (current and longest)
  let currentStreak = 0
  let longestStreak = 0
  if (allProgress.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedDates = new Set(
      allProgress
        .filter((p) => p.completedAt)
        .map((p) => {
          const date = new Date(p.completedAt!)
          date.setHours(0, 0, 0, 0)
          return date.getTime()
        })
    )

    // Calculate current streak
    let checkDate = new Date(today)
    while (completedDates.has(checkDate.getTime())) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Calculate longest streak (sort dates from oldest to newest)
    const sortedDates = Array.from(completedDates).sort((a, b) => a - b)
    if (sortedDates.length > 0) {
      let maxStreak = 1
      let currentRun = 1
      
      for (let i = 1; i < sortedDates.length; i++) {
        const daysDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24)
        if (daysDiff === 1) {
          currentRun++
          maxStreak = Math.max(maxStreak, currentRun)
        } else {
          currentRun = 1
        }
      }
      longestStreak = maxStreak
    }
  }

  return {
    recommendation: recommendationResult,
    residencyData,
    currentStreak,
    longestStreak,
    weeklyGoal,
    latestKeyInsight,
    learningTrack: (profile && 'learningTrack' in profile ? profile.learningTrack : null) || null,
    recentActivities,
    aggregateScores: aggregateScoresResult as unknown as Record<string, number> | null,
    jumpBackInItems,
    strengthenCoreShelves,
    newContent,
    popularContent,
    practiceSpotlight,
    continueYearPath,
    themedCollections,
    moduleCollections,
    learningPaths,
    domainCompletions,
    roadmap,
  }
}
