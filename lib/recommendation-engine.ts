import { prisma } from '@/lib/prisma/server'
import { getSmartCurriculumRecommendation } from './content-mapping'

export interface Recommendation {
  type: 'curriculum' | 'simulation'
  id: string
  title: string
  reason: string
  url: string
  competencyName?: string
  residencyYear?: number
}

/**
 * Smart recommendation engine based on curriculum structure and user progress
 * 
 * This replaces the old article-based system with curriculum-aware recommendations
 */
export async function getSmartRecommendations(userId: string): Promise<Recommendation | null> {
  // Get user's current residency
  const userResidency = await prisma.userResidency.findUnique({
    where: { userId },
    select: { currentResidency: true },
  })

  // Get user's curriculum progress
  const lessonProgress = await prisma.userLessonProgress.findMany({
    where: { userId },
    select: {
      domainId: true,
      moduleId: true,
      lessonId: true,
      status: true,
      completedAt: true,
    },
    orderBy: { completedAt: 'desc' },
  })

  // Format for the recommendation function
  const formattedProgress = lessonProgress.map((p) => ({
    domain_id: p.domainId,
    module_id: p.moduleId,
    lesson_id: p.lessonId,
    status: p.status,
    completed_at: p.completedAt?.toISOString() || null,
  }))

  // Find the most recent lesson or next lesson to continue
  const curriculumRecommendation = getSmartCurriculumRecommendation(formattedProgress)

  if (curriculumRecommendation) {
    return {
      type: 'curriculum',
      id: `${curriculumRecommendation.domain}-${curriculumRecommendation.module}-${curriculumRecommendation.lesson}`,
      title: curriculumRecommendation.title,
      reason: curriculumRecommendation.reason,
      url: curriculumRecommendation.url,
      residencyYear: userResidency?.currentResidency,
    }
  }

  // Fall back to first lesson if no progress
  return {
    type: 'curriculum',
    id: 'capital-allocation-ceo-as-investor-five-choices',
    title: 'The Five Choices',
    reason: 'Start your learning journey with foundational capital allocation concepts',
    url: '/library/curriculum/capital-allocation/ceo-as-investor/five-choices',
    residencyYear: userResidency?.currentResidency,
  }
}

// Legacy function removed - now using curriculum-based recommendations

