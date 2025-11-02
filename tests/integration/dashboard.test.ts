import { describe, expect, it, vi, beforeEach } from 'vitest'
import { assembleDashboardData } from '@/lib/dashboard-assembler'

// Mock all dependencies
vi.mock('@/lib/prisma/server', () => ({
  prisma: {
    userLessonProgress: {
      findMany: vi.fn(),
    },
    simulation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    userArticleProgress: {
      findMany: vi.fn(),
    },
    debrief: {
      findMany: vi.fn(),
    },
    userLessonProgress: {
      groupBy: vi.fn(),
    },
    simulation: {
      groupBy: vi.fn(),
    },
    case: {
      findMany: vi.fn(),
    },
    article: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/get-residency', () => ({
  getUserResidency: vi.fn().mockResolvedValue({ currentResidency: 1 }),
}))

vi.mock('@/lib/database-functions', () => ({
  getUserAggregateScores: vi.fn().mockResolvedValue({
    financialAcumen: 2.5,
    strategicThinking: 3.0,
    marketAwareness: 0,
    riskManagement: 0,
    leadershipJudgment: 0,
  }),
}))

vi.mock('@/lib/recommendation-engine', () => ({
  getSmartRecommendations: vi.fn().mockResolvedValue({
    primary: {
      type: 'curriculum',
      id: 'test-lesson',
      title: 'Test Lesson',
      reason: 'Test reason',
      url: '/library/curriculum/test',
    },
    alternates: [],
  }),
}))

vi.mock('@/lib/curriculum-data', () => ({
  getAllLessonsFlat: vi.fn().mockReturnValue([
    {
      domain: 'second-order-decision-making',
      moduleId: 'test-module',
      lessonId: 'test-lesson',
      lessonTitle: 'Test Lesson',
      moduleTitle: 'Test Module',
      domainTitle: 'Test Domain',
    },
  ]),
  getDomainById: vi.fn().mockReturnValue({
    id: 'second-order-decision-making',
    title: 'Test Domain',
    modules: [],
  }),
}))

vi.mock('@/lib/case-study-loader', () => ({
  getAllInteractiveSimulations: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/content-collections', () => ({
  createThemedCollections: vi.fn().mockReturnValue([]),
  getModuleCollections: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/learning-paths', () => ({
  getAllLearningPaths: vi.fn().mockReturnValue([]),
}))

vi.mock('@/lib/cache', () => ({
  cache: vi.fn(() => async () => []),
  CacheTags: {
    ARTICLES: 'articles',
  },
}))

describe('Dashboard Assembler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return dashboard data structure with all required fields', async () => {
    const { prisma } = await import('@/lib/prisma/server')
    vi.mocked(prisma.userLessonProgress.findMany).mockResolvedValue([])
    vi.mocked(prisma.simulation.findMany).mockResolvedValue([])
    vi.mocked(prisma.userArticleProgress.findMany).mockResolvedValue([])
    vi.mocked(prisma.case.findMany).mockResolvedValue([])
    vi.mocked(prisma.article.findMany).mockResolvedValue([])
    vi.mocked(prisma.forumThread.findMany).mockResolvedValue([])

    const result = await assembleDashboardData('user-123')

    expect(result).toHaveProperty('recommendation')
    expect(result).toHaveProperty('residencyData')
    expect(result).toHaveProperty('currentStreak')
    expect(result).toHaveProperty('recentActivities')
    expect(result).toHaveProperty('aggregateScores')
    expect(result).toHaveProperty('jumpBackInItems')
    expect(result).toHaveProperty('strengthenCoreShelves')
    expect(result).toHaveProperty('newContent')
    expect(result).toHaveProperty('popularContent')
    expect(result).toHaveProperty('practiceSpotlight')
    expect(result).toHaveProperty('continueYearPath')
    expect(result).toHaveProperty('themedCollections')
    expect(result).toHaveProperty('moduleCollections')
    expect(result).toHaveProperty('learningPaths')
  })

  it('should handle errors gracefully and return empty arrays', async () => {
    const { prisma } = await import('@/lib/prisma/server')
    vi.mocked(prisma.userLessonProgress.findMany).mockRejectedValue(new Error('DB error'))
    vi.mocked(prisma.simulation.findMany).mockResolvedValue([])
    vi.mocked(prisma.userArticleProgress.findMany).mockResolvedValue([])
    vi.mocked(prisma.case.findMany).mockResolvedValue([])
    vi.mocked(prisma.article.findMany).mockResolvedValue([])
    const result = await assembleDashboardData('user-123')

    // Should still return structure with empty arrays
    expect(result.jumpBackInItems).toEqual([])
  })
})

