import { trackEvents } from '@/lib/analytics'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock PostHog
const mockCapture = vi.fn()
const mockIdentify = vi.fn()

vi.mock('posthog-node', () => ({
  PostHog: vi.fn(() => ({
    capture: mockCapture,
    identify: mockIdentify,
    shutdown: vi.fn(),
  })),
}))

vi.mock('posthog-js', () => ({
  default: {
    capture: mockCapture,
    identify: mockIdentify,
  },
  posthog: {
    capture: mockCapture,
    identify: mockIdentify,
  },
}))

describe('Analytics Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment
    process.env.NODE_ENV = 'test'
  })

  describe('trackEvents', () => {
    describe('userSignedUp', () => {
      it('should track user signup event', () => {
        const userId = 'user-123'
        const email = 'test@example.com'

        trackEvents.userSignedUp(userId, email)

        expect(mockCapture).toHaveBeenCalledWith({
          distinctId: userId,
          event: 'user_signed_up',
          properties: {
            email,
          },
        })
      })
    })

    describe('simulationStarted', () => {
      it('should track simulation start event', () => {
        const simulationId = 'sim-123'
        const caseId = 'case-456'
        const userId = 'user-789'

        trackEvents.simulationStarted(simulationId, caseId, userId)

        expect(mockCapture).toHaveBeenCalledWith({
          distinctId: userId,
          event: 'simulation_started',
          properties: {
            simulation_id: simulationId,
            case_id: caseId,
          },
        })
      })
    })

    describe('simulationCompleted', () => {
      it('should track simulation completion event', () => {
        const simulationId = 'sim-123'
        const caseId = 'case-456'
        const userId = 'user-789'

        trackEvents.simulationCompleted(simulationId, caseId, userId)

        expect(mockCapture).toHaveBeenCalledWith({
          distinctId: userId,
          event: 'simulation_completed',
          properties: {
            simulation_id: simulationId,
            case_id: caseId,
          },
        })
      })
    })

    describe('lessonViewed', () => {
      it('should track lesson view event', () => {
        const lessonId = 'lesson-123'
        const domainId = 'domain-456'
        const moduleId = 'module-789'
        const userId = 'user-abc'

        trackEvents.lessonViewed(lessonId, domainId, moduleId, userId)

        expect(mockCapture).toHaveBeenCalledWith({
          distinctId: userId,
          event: 'lesson_viewed',
          properties: {
            lesson_id: lessonId,
            domain_id: domainId,
            module_id: moduleId,
          },
        })
      })
    })

    describe('lessonCompleted', () => {
      it('should track lesson completion event', () => {
        const lessonId = 'lesson-123'
        const domainId = 'domain-456'
        const moduleId = 'module-789'
        const userId = 'user-abc'

        trackEvents.lessonCompleted(lessonId, domainId, moduleId, userId)

        expect(mockCapture).toHaveBeenCalledWith({
          distinctId: userId,
          event: 'lesson_completed',
          properties: {
            lesson_id: lessonId,
            domain_id: domainId,
            module_id: moduleId,
          },
        })
      })
    })

    describe('debriefShared', () => {
      it('should track debrief share event with platform', () => {
        const simulationTitle = 'Test Simulation'
        const platform = 'linkedin'
        const userId = 'user-123'

        trackEvents.debriefShared(simulationTitle, platform, userId)

        expect(mockCapture).toHaveBeenCalledWith({
          distinctId: userId,
          event: 'debrief_shared',
          properties: {
            simulation_title: simulationTitle,
            platform,
          },
        })
      })
    })
  })
})


