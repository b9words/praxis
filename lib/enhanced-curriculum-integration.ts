/**
 * Enhanced Curriculum Integration
 * 
 * Integrates interactive simulations with the curriculum system to create
 * a seamless Learn → Practice → Debrief experience.
 */

import { getAllInteractiveSimulations } from './case-study-loader'
import { getAllLessonsFlat, getDomainById } from './curriculum-data'

export interface EnhancedLearningPath {
  domain: string
  domainTitle: string
  module: string
  moduleTitle: string
  lesson: string
  lessonTitle: string
  type: 'lesson' | 'simulation'
  content?: {
    id: string
    title: string
    description: string
    difficulty: string
    estimatedTime: number
    competencies: string[]
  }
  simulationId?: string
  prerequisites?: string[]
  learningObjectives: string[]
}

export interface DomainWithSimulations {
  domainId: string
  domainTitle: string
  philosophy: string
  totalLessons: number
  totalSimulations: number
  estimatedHours: number
  learningPath: EnhancedLearningPath[]
  keyCompetencies: string[]
  difficultyProgression: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * Map simulations to curriculum domains based on competencies
 */
const simulationToDomainMapping: Record<string, string> = {
  // Financial/Unit Economics simulations
  'cs_unit_economics_crisis': 'second-order-decision-making',
  'cs_01_tesla_production_crisis_2018': 'crisis-leadership-public-composure',
  'cs_02_disney_streaming_pivot_2017': 'technological-market-foresight',
  'cs_03_airbnb_covid_crisis_2020': 'crisis-leadership-public-composure',
  'cs_04_netflix_content_strategy_2019': 'competitive-moat-architecture',
  'cs_05_zoom_security_crisis_2020': 'crisis-leadership-public-composure',
  
  // Strategic thinking simulations
  'cs_skill_01_asymmetric_warfare': 'competitive-moat-architecture',
  'cs_skill_02_second_order': 'second-order-decision-making',
  'cs_skill_03_cannibalization': 'second-order-decision-making'
}

/**
 * Get enhanced curriculum with integrated simulations
 */
export function getEnhancedCurriculum(): DomainWithSimulations[] {
  const allLessons = getAllLessonsFlat()
  const allSimulations = getAllInteractiveSimulations()
  
  // Group lessons by domain
  const domainMap = new Map<string, EnhancedLearningPath[]>()
  
  // Add lessons to domains
  allLessons.forEach(lesson => {
    if (!domainMap.has(lesson.domain)) {
      domainMap.set(lesson.domain, [])
    }
    
    domainMap.get(lesson.domain)!.push({
      domain: lesson.domain,
      domainTitle: lesson.domainTitle,
      module: lesson.moduleId,
      moduleTitle: lesson.moduleTitle,
      lesson: lesson.lessonId,
      lessonTitle: lesson.lessonTitle,
      type: 'lesson',
      learningObjectives: [
        `Understand ${lesson.lessonTitle.toLowerCase()}`,
        `Apply concepts in real-world scenarios`,
        `Develop strategic thinking skills`
      ]
    })
  })
  
  // Add simulations to appropriate domains
  allSimulations.forEach(simulation => {
    const targetDomain = simulationToDomainMapping[simulation.caseId]
    if (targetDomain && domainMap.has(targetDomain)) {
      domainMap.get(targetDomain)!.push({
        domain: targetDomain,
        domainTitle: getDomainById(targetDomain)?.title || 'Unknown Domain',
        module: 'simulations',
        moduleTitle: 'Interactive Simulations',
        lesson: simulation.caseId,
        lessonTitle: simulation.title,
        type: 'simulation',
        content: {
          id: simulation.caseId,
          title: simulation.title,
          description: simulation.description,
          difficulty: simulation.difficulty,
          estimatedTime: simulation.estimatedDuration,
          competencies: simulation.competencies
        },
        simulationId: simulation.caseId,
        learningObjectives: simulation.competencies.map(comp => 
          `Master ${comp.toLowerCase()} through hands-on practice`
        )
      })
    }
  })
  
  // Convert to enhanced domains
  const enhancedDomains: DomainWithSimulations[] = []
  
  domainMap.forEach((learningPath, domainId) => {
    const domain = getDomainById(domainId)
    if (!domain) return
    
    const lessons = learningPath.filter(item => item.type === 'lesson')
    const simulations = learningPath.filter(item => item.type === 'simulation')
    
    // Sort learning path: lessons first, then simulations
    const sortedPath = [
      ...lessons.sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle)),
      ...simulations.sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle))
    ]
    
    enhancedDomains.push({
      domainId,
      domainTitle: domain.title,
      philosophy: domain.philosophy,
      totalLessons: lessons.length,
      totalSimulations: simulations.length,
      estimatedHours: Math.round((lessons.length * 12 + simulations.length * 90) / 60),
      learningPath: sortedPath,
      keyCompetencies: extractKeyCompetencies(sortedPath),
      difficultyProgression: determineDifficultyProgression(sortedPath)
    })
  })
  
  return enhancedDomains.sort((a, b) => a.domainTitle.localeCompare(b.domainTitle))
}

/**
 * Get learning path for a specific domain with Learn → Practice → Debrief flow
 */
export function getDomainLearningFlow(domainId: string): {
  learn: EnhancedLearningPath[]
  practice: EnhancedLearningPath[]
  debrief: string[]
} {
  const enhancedDomains = getEnhancedCurriculum()
  const domain = enhancedDomains.find(d => d.domainId === domainId)
  
  if (!domain) {
    return { learn: [], practice: [], debrief: [] }
  }
  
  const learn = domain.learningPath.filter(item => item.type === 'lesson')
  const practice = domain.learningPath.filter(item => item.type === 'simulation')
  
  // Generate debrief topics based on simulations
  const debrief = practice.map(sim => 
    `Analyze your performance in "${sim.lessonTitle}" and identify key learning insights`
  )
  
  return { learn, practice, debrief }
}

/**
 * Get next recommended item in learning path
 */
export function getNextLearningRecommendation(
  domainId: string,
  completedLessons: string[],
  completedSimulations: string[]
): EnhancedLearningPath | null {
  const domain = getEnhancedCurriculum().find(d => d.domainId === domainId)
  if (!domain) return null
  
  // First, complete all lessons
  const incompleteLessons = domain.learningPath.filter(
    item => item.type === 'lesson' && !completedLessons.includes(item.lesson)
  )
  
  if (incompleteLessons.length > 0) {
    return incompleteLessons[0]
  }
  
  // Then, move to simulations
  const incompleteSimulations = domain.learningPath.filter(
    item => item.type === 'simulation' && !completedSimulations.includes(item.lesson)
  )
  
  if (incompleteSimulations.length > 0) {
    return incompleteSimulations[0]
  }
  
  return null // Domain completed
}

/**
 * Calculate domain completion percentage
 */
export function calculateDomainProgress(
  domainId: string,
  completedLessons: string[],
  completedSimulations: string[]
): {
  lessonsProgress: number
  simulationsProgress: number
  overallProgress: number
  phase: 'learn' | 'practice' | 'debrief' | 'complete'
} {
  const domain = getEnhancedCurriculum().find(d => d.domainId === domainId)
  if (!domain) {
    return { lessonsProgress: 0, simulationsProgress: 0, overallProgress: 0, phase: 'learn' }
  }
  
  const lessons = domain.learningPath.filter(item => item.type === 'lesson')
  const simulations = domain.learningPath.filter(item => item.type === 'simulation')
  
  const completedLessonCount = lessons.filter(l => completedLessons.includes(l.lesson)).length
  const completedSimulationCount = simulations.filter(s => completedSimulations.includes(s.lesson)).length
  
  const lessonsProgress = lessons.length > 0 ? (completedLessonCount / lessons.length) * 100 : 100
  const simulationsProgress = simulations.length > 0 ? (completedSimulationCount / simulations.length) * 100 : 100
  
  const totalItems = lessons.length + simulations.length
  const completedItems = completedLessonCount + completedSimulationCount
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 100
  
  // Determine current phase
  let phase: 'learn' | 'practice' | 'debrief' | 'complete' = 'learn'
  
  if (overallProgress === 100) {
    phase = 'complete'
  } else if (lessonsProgress === 100 && simulationsProgress > 0) {
    phase = 'debrief'
  } else if (lessonsProgress === 100) {
    phase = 'practice'
  } else {
    phase = 'learn'
  }
  
  return {
    lessonsProgress: Math.round(lessonsProgress),
    simulationsProgress: Math.round(simulationsProgress),
    overallProgress: Math.round(overallProgress),
    phase
  }
}

/**
 * Get simulation recommendations based on completed lessons
 */
export function getSimulationRecommendations(
  completedLessons: string[],
  userCompetencies?: string[]
): EnhancedLearningPath[] {
  const allSimulations = getAllInteractiveSimulations()
  const enhancedDomains = getEnhancedCurriculum()
  
  const recommendations: EnhancedLearningPath[] = []
  
  // Find simulations in domains where user has completed lessons
  enhancedDomains.forEach(domain => {
    const domainLessons = domain.learningPath.filter(item => item.type === 'lesson')
    const domainSimulations = domain.learningPath.filter(item => item.type === 'simulation')
    
    const completedDomainLessons = domainLessons.filter(lesson => 
      completedLessons.includes(lesson.lesson)
    ).length
    
    // If user has completed at least 50% of domain lessons, recommend simulations
    if (completedDomainLessons >= domainLessons.length * 0.5) {
      recommendations.push(...domainSimulations)
    }
  })
  
  // Sort by difficulty and user competency match
  return recommendations
    .sort((a, b) => {
      const aDifficulty = a.content?.difficulty === 'beginner' ? 1 : a.content?.difficulty === 'intermediate' ? 2 : 3
      const bDifficulty = b.content?.difficulty === 'beginner' ? 1 : b.content?.difficulty === 'intermediate' ? 2 : 3
      return aDifficulty - bDifficulty
    })
    .slice(0, 5) // Top 5 recommendations
}

/**
 * Extract key competencies from learning path
 */
function extractKeyCompetencies(learningPath: EnhancedLearningPath[]): string[] {
  const competencies = new Set<string>()
  
  learningPath.forEach(item => {
    if (item.content?.competencies) {
      item.content.competencies.forEach(comp => competencies.add(comp))
    }
    
    // Add default competencies based on type
    if (item.type === 'lesson') {
      competencies.add('Strategic Thinking')
      competencies.add('Business Analysis')
    } else {
      competencies.add('Decision Making')
      competencies.add('Crisis Management')
    }
  })
  
  return Array.from(competencies).slice(0, 5) // Top 5 competencies
}

/**
 * Determine difficulty progression for domain
 */
function determineDifficultyProgression(learningPath: EnhancedLearningPath[]): 'beginner' | 'intermediate' | 'advanced' {
  const difficulties = learningPath
    .filter(item => item.content?.difficulty)
    .map(item => item.content!.difficulty)
  
  const advancedCount = difficulties.filter(d => d === 'advanced').length
  const intermediateCount = difficulties.filter(d => d === 'intermediate').length
  
  if (advancedCount > difficulties.length * 0.5) return 'advanced'
  if (intermediateCount > difficulties.length * 0.3) return 'intermediate'
  return 'beginner'
}

/**
 * Generate learning analytics for domain
 */
export function getDomainAnalytics(
  domainId: string,
  userProgress: {
    completedLessons: string[]
    completedSimulations: string[]
    timeSpent: Record<string, number>
  }
): {
  completionRate: number
  averageTimePerLesson: number
  strongestCompetencies: string[]
  recommendedNext: string[]
  learningVelocity: number // lessons per week
} {
  const domain = getEnhancedCurriculum().find(d => d.domainId === domainId)
  if (!domain) {
    return {
      completionRate: 0,
      averageTimePerLesson: 0,
      strongestCompetencies: [],
      recommendedNext: [],
      learningVelocity: 0
    }
  }
  
  const progress = calculateDomainProgress(
    domainId,
    userProgress.completedLessons,
    userProgress.completedSimulations
  )
  
  const totalTimeSpent = Object.values(userProgress.timeSpent).reduce((sum, time) => sum + time, 0)
  const completedItems = userProgress.completedLessons.length + userProgress.completedSimulations.length
  const averageTimePerLesson = completedItems > 0 ? totalTimeSpent / completedItems : 0
  
  // Calculate learning velocity (simplified)
  const learningVelocity = completedItems > 0 ? completedItems / 4 : 0 // Assume 4 weeks of activity
  
  return {
    completionRate: progress.overallProgress,
    averageTimePerLesson: Math.round(averageTimePerLesson / 60), // Convert to minutes
    strongestCompetencies: domain.keyCompetencies.slice(0, 3),
    recommendedNext: getSimulationRecommendations(userProgress.completedLessons)
      .slice(0, 3)
      .map(sim => sim.lessonTitle),
    learningVelocity: Math.round(learningVelocity * 10) / 10
  }
}
