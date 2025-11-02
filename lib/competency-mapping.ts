/**
 * Competency to Domain mapping
 * This centralizes the mapping between competency keys (from getUserAggregateScores)
 * and domain IDs (from curriculum structure) to avoid drift
 */

export interface CompetencyMapping {
  domainId: string
  displayName: string
}

/**
 * Maps competency keys (from getUserAggregateScores) to domain IDs
 * These keys should match the keys returned by getUserAggregateScores()
 */
export const COMPETENCY_TO_DOMAIN_MAP: Record<string, CompetencyMapping> = {
  financialAcumen: {
    domainId: 'second-order-decision-making',
    displayName: 'Financial Acumen',
  },
  strategicThinking: {
    domainId: 'competitive-moat-architecture',
    displayName: 'Strategic Thinking',
  },
  marketAwareness: {
    domainId: 'technological-market-foresight',
    displayName: 'Market Awareness',
  },
  riskManagement: {
    domainId: 'crisis-leadership-public-composure',
    displayName: 'Risk Management',
  },
  leadershipJudgment: {
    domainId: 'organizational-design-talent-density',
    displayName: 'Leadership Judgment',
  },
}

/**
 * Get domain ID for a competency key
 */
export function getDomainForCompetency(competencyKey: string): string | null {
  return COMPETENCY_TO_DOMAIN_MAP[competencyKey]?.domainId || null
}

/**
 * Get display name for a competency key
 */
export function getDisplayNameForCompetency(competencyKey: string): string {
  return COMPETENCY_TO_DOMAIN_MAP[competencyKey]?.displayName || competencyKey
}

/**
 * Get all competency keys that are mapped
 */
export function getMappedCompetencyKeys(): string[] {
  return Object.keys(COMPETENCY_TO_DOMAIN_MAP)
}

