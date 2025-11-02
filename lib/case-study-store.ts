import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CaseStudyFile {
  fileId: string
  fileName: string
  fileType: 'MEMO' | 'FINANCIAL_DATA' | 'REPORT' | 'PRESENTATION_DECK' | 'LEGAL_DOCUMENT'
  source: {
    type: 'STATIC' | 'REMOTE_CSV' | 'REMOTE_PDF' | 'REMOTE_API' | 'REFERENCE'
    content?: string
    url?: string
    path?: string // For REFERENCE type
  }
}

export interface ChallengeBlock {
  blockId: string
  blockType: string
  props: Record<string, any>
}

export interface CaseStudyStage {
  stageId: string
  stageTitle: string
  challengeType: string
  challengeLayout?: string
  challengeData: {
    prompt?: string
    blocks?: ChallengeBlock[]
    options?: Array<{
      id: string
      title: string
      description: string
    }>
    analystQuestions?: Array<{
      persona: string
      question: string
    }>
    documentToCritique?: string
    timer?: {
      durationSeconds: number
    }
    [key: string]: any
  }
}

export interface CaseStudyData {
  caseId: string
  version: string
  title: string
  description: string
  competencies: string[]
  caseFiles: CaseStudyFile[]
  stages: CaseStudyStage[]
}

export interface BlockState {
  content?: any
  isValid?: boolean
  wordCount?: number
  lastUpdated?: string
  modelData?: Record<string, any>
  calculatedValues?: Record<string, any>
  validationErrors?: string[]
}

export interface StageState {
  status: 'not_started' | 'in_progress' | 'completed'
  userSubmissions: Record<string, any>
  validation: {
    isValid: boolean
    errors: string[]
  }
  blockStates: Record<string, BlockState>
  startedAt?: number
  completedAt?: number
}

export interface TimerState {
  startTime?: number
  duration?: number
  remaining?: number
  isRunning: boolean
  stageId?: string
}

export interface EventLogEntry {
  event: string
  stageId?: string
  timestamp: number
  data?: any
}

interface CaseStudyStore {
  // Core data
  caseStudyData: CaseStudyData | null
  currentStageId: string | null
  
  // Stage management
  stageStates: Record<string, StageState>
  
  // Timer management
  timer: TimerState
  
  // Event logging
  eventLog: EventLogEntry[]
  
  // Actions
  loadCaseStudy: (data: CaseStudyData) => void
  setCurrentStage: (stageId: string) => void
  updateStageState: (stageId: string, updates: Partial<StageState>) => void
  submitStageData: (stageId: string, data: Record<string, any>) => void
  
  // Timer actions
  startTimer: (stageId: string, durationSeconds: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  updateTimer: () => void
  
  // Event logging
  logEvent: (event: string, stageId?: string, data?: any) => void
  
  // Utility
  getCurrentStage: () => CaseStudyStage | null
  getStageState: (stageId: string) => StageState
  isStageCompleted: (stageId: string) => boolean
  canProceedToStage: (stageId: string) => boolean
  reset: () => void
  
  // Block-specific actions
  getBlockState: (stageId: string, blockId: string) => BlockState | undefined
  updateBlockState: (stageId: string, blockId: string, updates: Partial<BlockState>) => void
  getAllBlockStates: (stageId: string) => Record<string, BlockState>
  validateStage: (stageId: string) => { isValid: boolean; errors: string[] }
}

const initialStageState: StageState = {
  status: 'not_started',
  userSubmissions: {},
  validation: { isValid: false, errors: [] },
  blockStates: {}
}

const initialTimerState: TimerState = {
  isRunning: false
}

export const useCaseStudyStore = create<CaseStudyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      caseStudyData: null,
      currentStageId: null,
      stageStates: {},
      timer: initialTimerState,
      eventLog: [],

      // Actions
      loadCaseStudy: (data: CaseStudyData) => {
        const stageStates: Record<string, StageState> = {}
        data.stages.forEach(stage => {
          stageStates[stage.stageId] = { ...initialStageState }
        })

        set({
          caseStudyData: data,
          currentStageId: data.stages[0]?.stageId || null,
          stageStates,
          timer: initialTimerState,
          eventLog: []
        })

        get().logEvent('CASE_LOADED', undefined, { caseId: data.caseId })
      },

      setCurrentStage: (stageId: string) => {
        const { caseStudyData, stageStates } = get()
        if (!caseStudyData) return

        const stage = caseStudyData.stages.find(s => s.stageId === stageId)
        if (!stage) return

        // Update stage state to in_progress if not started
        const currentState = stageStates[stageId]
        if (currentState.status === 'not_started') {
          get().updateStageState(stageId, {
            status: 'in_progress',
            startedAt: Date.now()
          })
        }

        set({ currentStageId: stageId })
        get().logEvent('STAGE_STARTED', stageId)

        // Start timer if stage has one
        if (stage.challengeData.timer) {
          get().startTimer(stageId, stage.challengeData.timer.durationSeconds)
        }
      },

      updateStageState: (stageId: string, updates: Partial<StageState>) => {
        set(state => ({
          stageStates: {
            ...state.stageStates,
            [stageId]: {
              ...state.stageStates[stageId],
              ...updates
            }
          }
        }))
      },

      submitStageData: (stageId: string, data: Record<string, any>) => {
        const { stageStates } = get()
        const currentState = stageStates[stageId]

        // Basic validation
        const isValid = Object.keys(data).length > 0
        const errors = isValid ? [] : ['Please complete all required fields']

        get().updateStageState(stageId, {
          userSubmissions: { ...currentState.userSubmissions, ...data },
          validation: { isValid, errors },
          status: isValid ? 'completed' : 'in_progress',
          completedAt: isValid ? Date.now() : undefined
        })

        get().logEvent('STAGE_SUBMITTED', stageId, data)

        // Auto-advance to next stage if completed
        if (isValid) {
          const { caseStudyData, currentStageId } = get()
          if (caseStudyData && currentStageId === stageId) {
            const currentIndex = caseStudyData.stages.findIndex(s => s.stageId === stageId)
            const nextStage = caseStudyData.stages[currentIndex + 1]
            if (nextStage) {
              setTimeout(() => get().setCurrentStage(nextStage.stageId), 1000)
            }
          }
        }
      },

      // Timer actions
      startTimer: (stageId: string, durationSeconds: number) => {
        const startTime = Date.now()
        set({
          timer: {
            startTime,
            duration: durationSeconds * 1000,
            remaining: durationSeconds * 1000,
            isRunning: true,
            stageId
          }
        })

        get().logEvent('TIMER_STARTED', stageId, { durationSeconds })
      },

      pauseTimer: () => {
        set(state => ({
          timer: { ...state.timer, isRunning: false }
        }))
        get().logEvent('TIMER_PAUSED', get().timer.stageId)
      },

      resumeTimer: () => {
        set(state => ({
          timer: { ...state.timer, isRunning: true }
        }))
        get().logEvent('TIMER_RESUMED', get().timer.stageId)
      },

      stopTimer: () => {
        set({ timer: initialTimerState })
        get().logEvent('TIMER_STOPPED', get().timer.stageId)
      },

      updateTimer: () => {
        const { timer } = get()
        if (!timer.isRunning || !timer.startTime || !timer.duration) return

        const elapsed = Date.now() - timer.startTime
        const remaining = Math.max(0, timer.duration - elapsed)

        if (remaining === 0) {
          // Timer expired
          get().stopTimer()
          get().logEvent('TIMER_EXPIRED', timer.stageId)
          
          // Auto-submit current stage
          if (timer.stageId) {
            const { stageStates } = get()
            const currentSubmissions = stageStates[timer.stageId]?.userSubmissions || {}
            get().submitStageData(timer.stageId, currentSubmissions)
          }
        } else {
          set(state => ({
            timer: { ...state.timer, remaining }
          }))
        }
      },

      // Event logging
      logEvent: (event: string, stageId?: string, data?: any) => {
        set(state => ({
          eventLog: [
            ...state.eventLog,
            {
              event,
              stageId,
              timestamp: Date.now(),
              data
            }
          ]
        }))
      },

      // Utility functions
      getCurrentStage: () => {
        const { caseStudyData, currentStageId } = get()
        if (!caseStudyData || !currentStageId) return null
        return caseStudyData.stages.find(s => s.stageId === currentStageId) || null
      },

      getStageState: (stageId: string) => {
        const { stageStates } = get()
        return stageStates[stageId] || { ...initialStageState }
      },

      isStageCompleted: (stageId: string) => {
        return get().getStageState(stageId).status === 'completed'
      },

      canProceedToStage: (stageId: string) => {
        const { caseStudyData } = get()
        if (!caseStudyData) return false

        const stageIndex = caseStudyData.stages.findIndex(s => s.stageId === stageId)
        if (stageIndex === 0) return true // First stage is always available

        // Check if previous stage is completed
        const previousStage = caseStudyData.stages[stageIndex - 1]
        return previousStage ? get().isStageCompleted(previousStage.stageId) : false
      },

      reset: () => {
        set({
          caseStudyData: null,
          currentStageId: null,
          stageStates: {},
          timer: initialTimerState,
          eventLog: []
        })
      },

      // Block-specific actions
      getBlockState: (stageId: string, blockId: string) => {
        const stageState = get().getStageState(stageId)
        return stageState.blockStates[blockId]
      },

      updateBlockState: (stageId: string, blockId: string, updates: Partial<BlockState>) => {
        set((state) => {
          const currentStageState = state.stageStates[stageId] || {
            ...initialStageState
          }

          const updatedBlockState = {
            ...currentStageState.blockStates[blockId],
            ...updates
          }

          return {
            stageStates: {
              ...state.stageStates,
              [stageId]: {
                ...currentStageState,
                status: 'in_progress' as const,
                blockStates: {
                  ...currentStageState.blockStates,
                  [blockId]: updatedBlockState
                }
              }
            }
          }
        })
      },

      getAllBlockStates: (stageId: string) => {
        const stageState = get().getStageState(stageId)
        return stageState.blockStates || {}
      },

      validateStage: (stageId: string) => {
        const blockStates = get().getAllBlockStates(stageId)
        const errors: string[] = []
        
        // Check if any blocks have validation errors
        Object.entries(blockStates).forEach(([blockId, blockState]) => {
          if (blockState.isValid === false) {
            errors.push(`Block ${blockId} has validation errors`)
          }
          if (blockState.validationErrors) {
            errors.push(...blockState.validationErrors)
          }
        })

        return {
          isValid: errors.length === 0,
          errors
        }
      }
    }),
    {
      name: 'case-study-storage',
      partialize: (state) => ({
        caseStudyData: state.caseStudyData,
        currentStageId: state.currentStageId,
        stageStates: state.stageStates,
        eventLog: state.eventLog
        // Don't persist timer state
      })
    }
  )
)
