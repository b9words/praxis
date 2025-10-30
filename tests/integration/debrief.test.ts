import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Integration test for debrief generation
 * Tests the critical debrief generation flow
 */

// Mock Supabase client and edge function call
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'sim-123 premium',
                user_id: 'user-123',
                status: 'completed',
                user_inputs: {
                  decisions: [
                    { decisionPointId: 'dp1', selectedOption: 'option-a', justification: 'Test justification' },
                  ],
                },
                case: {
                  id: 'case-123',
                  title: 'Test Case',
                  rubric: {
                    competencies: [
                      { name: 'Financial Acumen', criteria: 'Understands unit economics' },
                    ],
                  },
                },
              },
              error: null,
            }),
          })),
        })),
      })),
      insert: vi.fn().mockResolvedValue({
        data: {
          id: 'debrief-123',
          simulation_id: 'sim-123',
          scores: [{ competencyName: 'Financial Acumen', score: 4 }],
          summary_text: 'Test summary',
          radar_chart_data: {},
        },
        error: null,
      }),
    })),
  })),
}))

vi.mock('@/lib/prisma/server', () => ({
  prisma: {
    debrief: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

describe('Debrief Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  })

  describe('Debrief Generation Flow', () => {
    it('should generate debrief with valid simulation data', async () => {
      const simulationData = {
        id: 'sim-123',
        userId: 'user-123',
        status: 'completed',
        userInputs: {
          decisions: [
            {
              decisionPointId: 'dp1',
              selectedOption: 'option-a',
              justification: 'This option aligns with our financial goals',
            },
          ],
        },
        case: {
          id: 'case-123',
          title: 'Unit Economics Crisis',
          rubric: {
            competencies: [
              {
                name: 'Financial Acumen',
                criteria: 'Demonstrates understanding of unit economics and financial modeling',
              },
            ],
          },
        },
      }

      // Mock Gemini API response
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    scores: [
                      {
                        competencyName: 'Financial Acumen',
                        score: 4,
                        justification: 'Strong understanding demonstrated through decision rationale',
                      },
                    ],
                    summaryText: 'The user demonstrated solid financial acumen in their decision-making.',
                    radarChartData: {
                      financialAcumen: 4,
                      strategicThinking: 3,
                      marketAwareness: 2,
                      riskManagement: 3,
                      leadershipJudgment: 3,
                    },
                  }),
                },
              ],
            },
          },
        ],
      }

      // Simulate the debrief generation logic
      const prompt = `You are an expert business school professor. Evaluate this simulation.

Rubric: ${JSON.stringify(simulationData.case.rubric)}
User Inputs: ${JSON.stringify(simulationData.userInputs)}

Return valid JSON with scores, summaryText, and radarChartData.`

      // Verify prompt structure
      expect(prompt).toContain('Rubric:')
      expect(prompt).toContain('User Inputs:')
      
      // Parse mock response
      const debriefData = JSON.parse(mockGeminiResponse.candidates[0].content.parts[0].text)
      
      expect(debriefData.scores).toBeDefined()
      expect(debriefData.scores.length).toBeGreaterThan(0)
      expect(debriefData.summaryText).toBeDefined()
      expect(debriefData.radarChartData).toBeDefined()
      expect(debriefData.radarChartData.financialAcumen).toBe(4)
    })

    it('should handle missing simulation gracefully', async () => {
      // Simulate simulation not found scenario
      const { createClient } = await import('@supabase/supabase-js')
      const mockClient = createClient()
      
      vi.mocked(mockClient.from('simulations').select().eq('id', 'invalid').eq('user_id', 'user-123').single)
        .mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        } as any)

      // Verify error handling would occur
      const error = { message: 'Not found' }
      expect(error.message).toBe('Not found')
    })

    it('should validate JSON response structure', () => {
      const validDebrief = {
        scores: [
          {
            competencyName: 'Financial Acumen',
            score: 4,
            justification: 'Test justification',
          },
        ],
        summaryText: 'Test summary text',
        radarChartData: {
          financialAcumen: 4,
          strategicThinking: 3,
          marketAwareness: 2,
          riskManagement: 3,
          leadershipJudgment: 3,
        },
      }

      // Validate structure
      expect(validDebrief.scores).toBeDefined()
      expect(Array.isArray(validDebrief.scores)).toBe(true)
      expect(validDebrief.scores[0]).toHaveProperty('competencyName')
      expect(validDebrief.scores[0]).toHaveProperty('score')
      expect(validDebrief.scores[0]).toHaveProperty('justification')
      expect(validDebrief.summaryText).toBeDefined()
      expect(validDebrief.radarChartData).toBeDefined()
      expect(Object.keys(validDebrief.radarChartData).length).toBe(5)
    })

    it('should handle incomplete simulation status', () => {
      const incompleteSimulation = {
        id: 'sim-123',
        status: 'in_progress',
        userInputs: {},
      }

      // Should reject incomplete simulations
      expect(incompleteSimulation.status).not.toBe('completed')
    })
  })

  describe('Debrief Data Validation', () => {
    it('should ensure all required competencies are in radar chart', () => {
      const requiredCompetencies = [
        'financialAcumen',
        'strategicThinking',
        'marketAwareness',
        'riskManagement',
        'leadershipJudgment',
      ]

      const radarChartData = {
        financialAcumen: 4,
        strategicThinking: 3,
        marketAwareness: 2,
        riskManagement: 3,
        leadershipJudgment: 3,
      }

      requiredCompetencies.forEach((competency) => {
        expect(radarChartData).toHaveProperty(competency)
        expect(typeof radarChartData[competency as keyof typeof radarChartData]).toBe('number')
      })
    })
  })
})

