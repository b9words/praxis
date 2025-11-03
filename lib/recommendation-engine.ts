import { prisma } from '@/lib/prisma/server'
import { getSmartCurriculumRecommendation } from './content-mapping'
import { getUserAggregateScores } from './database-functions'
import { getAllLessonsFlat, getDomainById } from './curriculum-data'
import { getAllInteractiveSimulations } from './case-study-loader'
import { getAllLearningPaths, getLearningPathByCaseId } from './learning-paths'
import { getDomainIdForCompetency } from './competency-mapping'

export interface Recommendation {
  type: 'curriculum' | 'simulation'
  id: string
  title: string
  reason: string
  url: string
  competencyName?: string
  residencyYear?: number
}

export interface RecommendationWithAlternates {
  primary: Recommendation | null
  alternates: Recommendation[]
}

/**
 * Get foundational lesson for a domain (first lesson in first module)
 */
function getFoundationalLessonForDomain(domainId: string): { domain: string; module: string; lesson: string; url: string; title: string } | null {
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

/**
 * Check if user has completed all lessons in a module
 */
function hasCompletedModule(
  userId: string,
  domainId: string,
  moduleId: string,
  lessonProgress: Array<{ domainId: string; moduleId: string; lessonId: string; status: string }>
): boolean {
  const domain = getDomainById(domainId)
  const module = domain?.modules.find(m => m.id === moduleId)
  if (!module) return false

  const moduleLessons = module.lessons
  const completedLessons = lessonProgress.filter(
    p => p.domainId === domainId && p.moduleId === moduleId && p.status === 'completed'
  )

  return completedLessons.length === moduleLessons.length
}

/**
 * Get associated case study for a module
 */
function getCaseStudyForModule(domainId: string, moduleId: string): { id: string; title: string; url: string } | null {
  const allSimulations = getAllInteractiveSimulations()
  
  // Map module to case study based on domain and module
  // This is a simplified mapping - in production you'd have a more sophisticated mapping
  const caseMapping: Record<string, string> = {
    'capital-allocation-ceo-as-investor': 'cs_unit_economics_crisis',
    'second-order-decision-making-unit-economics-mastery': 'cs_unit_economics_crisis',
    // Add more mappings as needed
  }

  const caseKey = `${domainId}-${moduleId}`
  const caseId = caseMapping[caseKey]
  
  if (caseId) {
    const simulation = allSimulations.find(s => s.caseId === caseId)
    if (simulation) {
      return {
        id: caseId,
        title: simulation.title,
        url: `/simulations/${caseId}/brief`,
      }
    }
  }

  // Fallback: find first case study in domain
  const domainCases = allSimulations.filter(s => {
    // Simple domain matching - in production use proper mapping
    if (domainId.includes('second-order') && s.caseId.includes('unit_economics')) return true
    if (domainId.includes('competitive') && s.caseId.includes('asymmetric')) return true
    return false
  })

  if (domainCases.length > 0) {
    const caseStudy = domainCases[0]
    return {
      id: caseStudy.caseId,
      title: caseStudy.title,
      url: `/simulations/${caseStudy.caseId}/brief`,
    }
  }

  return null
}

/**
 * Check if user has completed Year 1 (all domains that are typically Year 1)
 */
function hasCompletedYear1(lessonProgress: Array<{ domainId: string; status: string }>): boolean {
  // Year 1 domains based on curriculum structure
  const year1Domains = [
    'capital-allocation',
    'second-order-decision-making',
    'competitive-moat-architecture',
    // Add more Year 1 domains as needed
  ]

  const allLessons = getAllLessonsFlat()
  const year1Lessons = allLessons.filter(l => year1Domains.includes(l.domain))
  const completedYear1Lessons = lessonProgress.filter(
    p => year1Domains.includes(p.domainId) && p.status === 'completed'
  )

  // Consider Year 1 complete if 80%+ of lessons are done (allowing for edge cases)
  return completedYear1Lessons.length >= year1Lessons.length * 0.8
}

/**
 * Get first module of Year 2
 */
function getFirstYear2Module(): { domain: string; module: string; lesson: string; url: string; title: string } | null {
  // Year 2 domains (typically more advanced)
  const year2Domains = [
    'high-stakes-dealmaking-integration',
    'investor-market-narrative-control',
    // Add more Year 2 domains
  ]

  for (const domainId of year2Domains) {
    const lesson = getFoundationalLessonForDomain(domainId)
    if (lesson) return lesson
  }

  return null
}

/**
 * Smart recommendation engine based on curriculum structure and user progress
 * Implements three rules:
 * 1. If competency score < 3.0, recommend foundational lesson
 * 2. If module completed, recommend associated case study
 * 3. If Year 1 completed, recommend first Year 2 module
 * 
 * Cooldown: Don't recommend content user touched in last 7 days
 * Returns primary recommendation and up to 2 alternates
 */
export async function getSmartRecommendations(userId: string): Promise<RecommendationWithAlternates> {
  // Get user's current residency
  let userResidency
  try {
    userResidency = await prisma.userResidency.findUnique({
      where: { userId },
      select: { currentResidency: true },
    })
  } catch (error: any) {
    // Handle missing table (P2021) or missing columns (P2022)
    if (error?.code === 'P2021' || error?.code === 'P2022' || error?.message?.includes('does not exist')) {
      // Table doesn't exist, use default residency of 1
      userResidency = { currentResidency: 1 }
    } else {
      throw error
    }
  }

  // Get user's curriculum progress
  let lessonProgress: Array<{
    domainId: string
    moduleId: string
    lessonId: string
    status: string
    completedAt: Date | null
    updatedAt: Date
  }> = []
  try {
    lessonProgress = await prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        domainId: true,
        moduleId: true,
        lessonId: true,
        status: true,
        completedAt: true,
        updatedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    })
  } catch (error: any) {
    // Handle missing table gracefully (P2021) - expected if migrations haven't run
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      lessonProgress = []
    } else if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching lesson progress in recommendations:', error)
    }
  }

  // Get recently touched content (last 7 days) for cooldown
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentContentIds = new Set<string>()
  
  // Get recent lesson progress
  lessonProgress.forEach(p => {
    if (p.updatedAt && new Date(p.updatedAt) >= sevenDaysAgo) {
      recentContentIds.add(`${p.domainId}-${p.moduleId}-${p.lessonId}`)
    }
  })
  
  // Get recent simulations - track by Case UUID
  let recentSimulations: Array<{
    caseId: string
    case: { title: string } | null
  }> = []
  try {
    recentSimulations = await prisma.simulation.findMany({
      where: {
        userId,
        updatedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        caseId: true,
        case: {
          select: {
            title: true,
          },
        },
      },
    })
  } catch (error: any) {
    // Handle missing table gracefully (P2021) - expected if migrations haven't run
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      recentSimulations = []
    } else if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching recent simulations in recommendations:', error)
    }
  }
  // Store both UUID and a normalized title-based ID for matching
  const recentCaseTitles = new Set<string>()
  recentSimulations.forEach(s => {
    recentContentIds.add(s.caseId) // Store UUID
    if (s.case?.title) {
      // Normalize title for matching (lowercase, no special chars)
      const normalized = s.case.title.toLowerCase().replace(/[^a-z0-9]/g, '')
      recentCaseTitles.add(normalized)
    }
  })
  
  // Helper to check if content should be excluded (cooldown)
  const isOnCooldown = (contentId: string) => recentContentIds.has(contentId)
  
  // Helper to check if case title matches recent cases (for InteractiveSimulation matching)
  const isCaseTitleOnCooldown = (caseTitle: string) => {
    const normalized = caseTitle.toLowerCase().replace(/[^a-z0-9]/g, '')
    return recentCaseTitles.has(normalized)
  }

  const candidates: Recommendation[] = []

  // RULE 0: Check debrief scores for low performance (< 3.0) - highest priority
  try {
    let recentDebriefs: any[] = []
    try {
      recentDebriefs = await prisma.debrief.findMany({
        where: {
          simulation: {
            userId,
          },
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
        include: {
          simulation: {
            include: {
              case: {
                include: {
                  competencies: {
                    include: {
                      competency: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      })
    } catch (error: any) {
      // Handle missing rubric_version column (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
          recentDebriefs = await prisma.debrief.findMany({
            where: {
              simulation: {
                userId,
              },
              createdAt: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
              },
            },
            select: {
              id: true,
              scores: true,
              createdAt: true,
              simulation: {
                select: {
                  id: true,
                  case: {
                    select: {
                      id: true,
                      title: true,
                      competencies: {
                        select: {
                          competency: {
                            select: {
                              id: true,
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          })
        } catch (fallbackError) {
          console.error('Error fetching debriefs (fallback):', fallbackError)
        }
      } else {
        throw error
      }
    }

    for (const debrief of recentDebriefs) {
      const scores = debrief.scores as any
      if (typeof scores === 'object' && scores !== null) {
        const scoreEntries = Array.isArray(scores) 
          ? scores 
          : Object.entries(scores).map(([key, value]: [string, any]) => ({
              competencyName: key,
              score: typeof value === 'number' ? value : (value?.score || 0),
            }))
        
        const lowScores = scoreEntries.filter((s: any) => {
          const score = typeof s === 'number' ? s : (s.score || 0)
          return score > 0 && score < 3.0
        })

        if (lowScores.length > 0 && debrief.simulation.case) {
          // Find foundational lessons for weak competencies
          for (const lowScore of lowScores.slice(0, 2)) {
            const competencyName = typeof lowScore === 'object' ? lowScore.competencyName : ''
            const domainId = getDomainIdForCompetency(competencyName)
            
            if (domainId) {
              const foundationalLesson = getFoundationalLessonForDomain(domainId)
              if (foundationalLesson) {
                const lessonId = `${foundationalLesson.domain}-${foundationalLesson.module}-${foundationalLesson.lesson}`
                if (!isOnCooldown(lessonId) && !candidates.some(c => c.id === lessonId)) {
                  candidates.push({
                    type: 'curriculum',
                    id: lessonId,
                    title: foundationalLesson.title,
                    reason: `Based on your recent performance, strengthen ${competencyName || 'this competency'}`,
                    url: foundationalLesson.url,
                    competencyName,
                    residencyYear: userResidency?.currentResidency,
                  })
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking debrief scores:', error)
  }

  // RULE 1: Check for weak competencies (< 3.0) and recommend foundational lessons
  try {
    const aggregateScores = await getUserAggregateScores(userId)
    const weakCompetencies = Object.entries(aggregateScores)
      .filter(([_, score]) => score > 0 && score < 3.0)
      .sort(([_, a], [__, b]) => a - b) // Sort by lowest score first

    if (weakCompetencies.length > 0) {
      // Get top 2 weak competencies for alternates
      const topWeakCompetencies = weakCompetencies.slice(0, 2)
      
      for (const [competencyName, score] of topWeakCompetencies) {
        const domainId = getDomainIdForCompetency(competencyName)
        
        if (domainId) {
          const foundationalLesson = getFoundationalLessonForDomain(domainId)
          if (foundationalLesson) {
            const lessonId = `${foundationalLesson.domain}-${foundationalLesson.module}-${foundationalLesson.lesson}`
            if (!isOnCooldown(lessonId)) {
              const competencyDisplayName = competencyName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim()
              candidates.push({
                type: 'curriculum',
                id: lessonId,
                title: foundationalLesson.title,
                reason: `Strengthen your ${competencyDisplayName} (current score: ${score.toFixed(1)}/5.0)`,
                url: foundationalLesson.url,
                competencyName: competencyDisplayName,
                residencyYear: userResidency?.currentResidency,
              })
            } else {
              // Try next lesson in domain if available
              const allLessons = getAllLessonsFlat()
              const domainLessons = allLessons.filter(l => l.domain === domainId)
              const foundationalIndex = domainLessons.findIndex(
                l => l.domain === foundationalLesson.domain &&
                     l.moduleId === foundationalLesson.module &&
                     l.lessonId === foundationalLesson.lesson
              )
              if (foundationalIndex >= 0 && foundationalIndex < domainLessons.length - 1) {
                const nextLesson = domainLessons[foundationalIndex + 1]
                const nextLessonId = `${nextLesson.domain}-${nextLesson.moduleId}-${nextLesson.lessonId}`
                if (!isOnCooldown(nextLessonId)) {
                  const competencyDisplayName = competencyName
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim()
                  candidates.push({
                    type: 'curriculum',
                    id: nextLessonId,
                    title: nextLesson.lessonTitle,
                    reason: `Strengthen your ${competencyDisplayName} (current score: ${score.toFixed(1)}/5.0)`,
                    url: `/library/curriculum/${nextLesson.domain}/${nextLesson.moduleId}/${nextLesson.lessonId}`,
                    competencyName: competencyDisplayName,
                    residencyYear: userResidency?.currentResidency,
                  })
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking weak competencies:', error)
  }

  // RULE 2: Check if user completed all lessons in a module, recommend case study
  const completedModules: Array<{ domainId: string; moduleId: string }> = []
  const moduleMap = new Map<string, boolean>()

  for (const progress of lessonProgress) {
    const moduleKey = `${progress.domainId}-${progress.moduleId}`
    if (!moduleMap.has(moduleKey)) {
      const isComplete = hasCompletedModule(userId, progress.domainId, progress.moduleId, lessonProgress)
      moduleMap.set(moduleKey, isComplete)
      if (isComplete) {
        completedModules.push({ domainId: progress.domainId, moduleId: progress.moduleId })
      }
    }
  }

  // Add up to 2 completed modules as candidates (for alternates)
  for (const completedModule of completedModules.slice(0, 2)) {
    const caseStudy = getCaseStudyForModule(completedModule.domainId, completedModule.moduleId)
    
    if (caseStudy && !isCaseTitleOnCooldown(caseStudy.title)) {
      // Skip if already in candidates
      if (!candidates.some(c => c.id === caseStudy.id)) {
        candidates.push({
          type: 'simulation',
          id: caseStudy.id,
          title: caseStudy.title,
          reason: 'Apply what you\'ve learned in a real-world scenario',
          url: caseStudy.url,
          residencyYear: userResidency?.currentResidency,
        })
      }
    }
  }

  // RULE 3: Learning path progression - check if user completed path lessons but not the case
  try {
    const allPaths = await getAllLearningPaths()
    
    for (const path of allPaths) {
      let completedLessons = 0
      let completedCase = false
      let caseItem = null
      
      for (const item of path.items) {
        if (item.type === 'lesson') {
          const progress = lessonProgress.find(
            p => p.domainId === item.domain &&
                 p.moduleId === item.module &&
                 p.lessonId === item.lesson &&
                 p.status === 'completed'
          )
          if (progress) {
            completedLessons++
          }
        } else if (item.type === 'case' && item.caseId) {
          caseItem = item
          const simulation = await prisma.simulation.findFirst({
            where: {
              userId,
              caseId: item.caseId,
              status: 'completed',
            },
          }).catch(() => null)
          if (simulation) {
            completedCase = true
          }
        }
      }
      
      // If all lessons completed but case not started/completed, recommend the case
      const lessonItems = path.items.filter(i => i.type === 'lesson')
      if (lessonItems.length > 0 && 
          completedLessons === lessonItems.length && 
          !completedCase && 
          caseItem) {
        const caseId = caseItem.caseId!
        if (!isOnCooldown(caseId) && !candidates.some(c => c.id === caseId)) {
          const allSimulations = getAllInteractiveSimulations()
          const simulation = allSimulations.find(s => s.caseId === caseId)
          if (simulation) {
            candidates.push({
              type: 'simulation',
              id: caseId,
              title: simulation.title,
              reason: `Complete the ${path.title} learning path`,
              url: `/simulations/${caseId}/brief`,
              residencyYear: userResidency?.currentResidency,
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking learning paths:', error)
  }

  // RULE 4: Check if Year 1 is complete, recommend Year 2
  if (hasCompletedYear1(lessonProgress)) {
    const year2Module = getFirstYear2Module()
    if (year2Module) {
      const year2Id = `${year2Module.domain}-${year2Module.module}-${year2Module.lesson}`
      if (!isOnCooldown(year2Id)) {
        // Skip if already in candidates
        if (!candidates.some(c => c.id === year2Id)) {
          candidates.push({
            type: 'curriculum',
            id: year2Id,
            title: year2Module.title,
            reason: 'Advance to Year 2 content and continue your learning journey',
            url: year2Module.url,
            residencyYear: userResidency?.currentResidency,
          })
        }
      }
    }
  }

  // Fallback: Continue from where user left off
  if (candidates.length === 0) {
    const formattedProgress = lessonProgress.map((p) => ({
      domain_id: p.domainId,
      module_id: p.moduleId,
      lesson_id: p.lessonId,
      status: p.status,
      completed_at: p.completedAt?.toISOString() || null,
    }))

    const inProgressLesson = lessonProgress.find(p => p.status === 'in_progress')
    if (inProgressLesson) {
      const currentPath = {
        domain: inProgressLesson.domainId,
        module: inProgressLesson.moduleId,
        lesson: inProgressLesson.lessonId,
      }
      const curriculumRecommendation = getSmartCurriculumRecommendation(formattedProgress, currentPath)
      
      if (curriculumRecommendation) {
        const recId = `${curriculumRecommendation.domain}-${curriculumRecommendation.module}-${curriculumRecommendation.lesson}`
        if (!isOnCooldown(recId)) {
          candidates.push({
            type: 'curriculum',
            id: recId,
            title: curriculumRecommendation.title,
            reason: curriculumRecommendation.reason,
            url: curriculumRecommendation.url,
            residencyYear: userResidency?.currentResidency,
          })
        }
      }
    }

    // Final fallback: first lesson
    if (candidates.length === 0) {
      const firstLesson = getAllLessonsFlat()[0]
      if (firstLesson) {
        const firstLessonId = `${firstLesson.domain}-${firstLesson.moduleId}-${firstLesson.lessonId}`
        if (!isOnCooldown(firstLessonId)) {
          candidates.push({
            type: 'curriculum',
            id: firstLessonId,
            title: firstLesson.lessonTitle,
            reason: 'Start your learning journey with foundational concepts',
            url: `/library/curriculum/${firstLesson.domain}/${firstLesson.moduleId}/${firstLesson.lessonId}`,
            residencyYear: userResidency?.currentResidency,
          })
        }
      }
    }
  }

  // Return primary (first candidate) and alternates (next 2)
  return {
    primary: candidates[0] || null,
    alternates: candidates.slice(1, 3),
  }
}

// Legacy function removed - now using curriculum-based recommendations

