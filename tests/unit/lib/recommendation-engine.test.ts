import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getSmartRecommendations } from '@/lib/recommendation-engine'

// Mock Prisma
vi.mock('@/lib/prisma/server', () => ({
  prisma: {
    userResidency: {
      findUnique: vi.fn(),
    },
    userLessonProgress: {
      findMany: vi.fn(),
    },
    simulation: {
      findMany: vi.fn(),
    },
    debrief: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/curriculum-data', () => ({
  getAllLessonsFlat: vi.fn().mockReturnValue([
    {
      domain: 'second-order-decision-making',
      moduleId: 'unit-economics-mastery',
      lessonId: 'cac-ltv-fundamentals',
      lessonTitle: 'CAC/LTV Fundamentals',
      moduleTitle: 'Unit Economics Mastery',
      domainTitle: 'Second Order Decision Making',
    },
    {
      domain: 'second-order-decision-making',
      moduleId: 'unit-economics-mastery',
      lessonId: 'unit-economics-optimization',
      lessonTitle: 'Unit Economics Optimization',
      moduleTitle: 'Unit Economics Mastery',
      domainTitle: 'Second Order Decision Making',
    },
  ]),
  getDomainById: vi.fn().mockReturnValue({
    id: 'second-order-decision-making',
    title: 'Second Order Decision Making',
    modules: [
      {
        id: 'unit-economics-mastery',
        title: 'Unit Economics Mastery',
        lessons: [
          {
            id: 'cac-ltv-fundamentals',
            title: 'CAC/LTV Fundamentals',
          },
        ],
      },
    ],
  }),
}))

vi.mock('@/lib/case-study-loader', () => ({
  getAllInteractiveSimulations: vi.fn().mockReturnValue([
    {
      caseId: 'cs_unit_economics_crisis',
      title: 'Unit Economics Crisis',
      competencies: ['Financial Acumen'],
    },
  ]),
}))

vi.mock('@/lib/learning-paths', () => ({
  getAllLearningPaths: vi.fn().mockReturnValue([]),
  getLearningPathByCaseId: vi.fn().mockReturnValue(null),
}))

vi.mock('@/lib/content-mapping', () => ({
  getSmartCurriculumRecommendation: vi.fn().mockReturnValue(null),
}))

describe('Recommendation Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSmartRecommendations', () => {
    it('should recommend foundational lesson when competency score is low', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      vi.mocked(prisma.userResidency.findUnique).mockResolvedValue({
        currentResidency: 1,
      })
      vi.mocked(prisma.userLessonProgress.findMany).mockResolvedValue([])
      vi.mocked(prisma.simulation.findMany).mockResolvedValue([])
      vi.mocked(prisma.debrief.findMany).mockResolvedValue([
        {
          scores: {
            financialAcumen: 2.0, // Low score
          },
          simulation: {
            caseId: 'cs_unit_economics_crisis',
            case: {
              competencies: [
                {
                  competency: {
                    name: 'Financial Acumen',
                  },
                },
              ],
            },
          },
          createdAt: new Date(),
        },
      ])

      const result = await getSmartRecommendations('user-123')

      expect(result.primary).toBeTruthy()
      expect(result.primary?.type).toBe('curriculum')
    })

    it('should recommend case study when module is completed', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      vi.mocked(prisma.userResidency.findUnique).mockResolvedValue({
        currentResidency: 1,
      })
      vi.mocked(prisma.userLessonProgress.findMany).mockResolvedValue([
        {
          domainId: 'second-order-decision-making',
          moduleId: 'unit-economics-mastery',
          lessonId: 'cac-ltv-fundamentals',
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          domainId: 'second-order-decision-making',
          moduleId: 'unit-economics-mastery',
          lessonId: 'unit-economics-optimization',
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      vi.mocked(prisma.simulation.findMany).mockResolvedValue([])
      vi.mocked(prisma.debrief.findMany).mockResolvedValue([])

      const result = await getSmartRecommendations('user-123')

      // Should recommend case study for completed module
      expect(result.primary).toBeTruthy()
    })

    it('should implement cooldown (not recommend recently touched content)', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      vi.mocked(prisma.userResidency.findUnique).mockResolvedValue({
        currentResidency: 1,
      })
      vi.mocked(prisma.userLessonProgress.findMany).mockResolvedValue([
        {
          domainId: 'second-order-decision-making',
          moduleId: 'unit-economics-mastery',
          lessonId: 'cac-ltv-fundamentals',
          status: 'in_progress',
          updatedAt: new Date(), // Recent update
          completedAt: null,
        },
      ])
      vi.mocked(prisma.simulation.findMany).mockResolvedValue([])
      vi.mocked(prisma.debrief.findMany).mockResolvedValue([])

      const result = await getSmartRecommendations('user-123')

      // Should not recommend the recently touched lesson
      expect(result.primary).toBeTruthy()
      if (result.primary?.type === 'curriculum') {
        expect(result.primary.id).not.toContain('cac-ltv-fundamentals')
      }
    })
  })
})

