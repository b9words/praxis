/**
 * Type definitions for simulation system
 */

export interface Persona {
  id: string
  name: string
  role: string
  motivations: string[]
  biases: string[]
  knowledge: Record<string, any>
}

export interface DecisionPoint {
  id: string
  order: number
  title: string
  description: string
  type: 'text' | 'multiple_choice' | 'role_play'
  requiresPersona?: string // Persona ID
  options?: Array<{
    id: string
    label: string
    value: string
  }>
  rubricMapping: string[] // Which competencies this tests
}

export interface CaseStructure {
  scenario: string
  yourRole: string
  keyStakeholders: Persona[]
  decisionPoints: DecisionPoint[]
}

export interface UserDecision {
  decisionPointId: string
  selectedOption?: string
  justification: string
  rolePlayTranscript?: Array<{
    role: 'user' | 'ai'
    message: string
    timestamp: string
  }>
}

export interface CaseStudyState {
  currentDecisionPoint: number
  decisions: UserDecision[]
  startedAt: string
  lastUpdated: string
}

// Legacy aliases for backward compatibility
export type SimulationState = CaseStudyState

