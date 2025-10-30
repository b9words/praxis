import { InteractiveSimulation, validateSimulation } from '@/lib/simulation-converter'
import { describe, expect, it } from 'vitest'

describe('Simulation Converter', () => {
  describe('validateSimulation', () => {
    it('should return empty array for valid simulation', () => {
      const validSimulation: InteractiveSimulation = {
        caseId: 'test-case',
        version: '1.0',
        title: 'Test Case',
        description: 'A test case description',
        competencies: ['Financial Analysis'],
        estimatedDuration: 120,
        difficulty: 'intermediate',
        caseFiles: [],
        stages: [
          {
            stageId: 'stage-1',
            stageTitle: 'Stage Title',
            description: 'Stage description',
            challengeType: 'STRATEGIC_OPTIONS',
            challengeData: {
              prompt: 'Test prompt',
            },
          },
        ],
        rubric: {
          criteria: [],
        },
      }

      const errors = validateSimulation(validSimulation)
      expect(errors).toEqual([])
    })

    it('should detect missing required fields', () => {
      const invalidSimulation = {
        // Missing caseId, version, title, etc.
      } as any

      const errors = validateSimulation(invalidSimulation)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should validate stages structure', () => {
      const invalidSimulation: InteractiveSimulation = {
        caseId: 'test-case',
        version: '1.0',
        title: 'Test Case',
        description: 'Test',
        competencies: [],
        estimatedDuration: 120,
        difficulty: 'intermediate',
        caseFiles: [],
        stages: [
          {
            stageId: '', // Invalid: empty stageId
            description: 'Stage description',
            challengeType: '', // Invalid: empty challengeType
            challengeData: {},
          },
        ],
        rubric: {},
      } as any

      const errors = validateSimulation(invalidSimulation)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should validate competencies array', () => {
      const invalidSimulation: InteractiveSimulation = {
        caseId: 'test-case',
        version: '1.0',
        title: 'Test Case',
        description: 'Test',
        competencies: 'not-an-array' as any, // Invalid: should be array
        estimatedDuration: 120,
        difficulty: 'intermediate',
        caseFiles: [],
        stages: [],
        rubric: {},
      }

      const errors = validateSimulation(invalidSimulation)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should validate estimatedDuration is positive', () => {
      const invalidSimulation: InteractiveSimulation = {
        caseId: 'test-case',
        version: '1.0',
        title: 'Test Case',
        description: 'Test',
        competencies: [],
        estimatedDuration: -10, // Invalid: negative duration
        difficulty: 'intermediate',
        caseFiles: [],
        stages: [],
        rubric: {},
      }

      const errors = validateSimulation(invalidSimulation)
      // Should detect invalid duration
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.toLowerCase().includes('duration'))).toBe(true)
    })
  })
})

