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
 * Get domain ID for a competency name or key
 * Handles both competency keys (from getUserAggregateScores) and display names
 */
export function getDomainIdForCompetency(competencyNameOrKey: string): string | null {
  // Try direct key match first
  if (COMPETENCY_TO_DOMAIN_MAP[competencyNameOrKey]) {
    return COMPETENCY_TO_DOMAIN_MAP[competencyNameOrKey].domainId
  }
  
  // Try normalized key match (lowercase, no spaces)
  const normalized = competencyNameOrKey.toLowerCase().replace(/\s+/g, '')
  if (COMPETENCY_TO_DOMAIN_MAP[normalized]) {
    return COMPETENCY_TO_DOMAIN_MAP[normalized].domainId
  }
  
  // Try display name match
  for (const [key, mapping] of Object.entries(COMPETENCY_TO_DOMAIN_MAP)) {
    if (mapping.displayName === competencyNameOrKey || 
        mapping.displayName.toLowerCase() === competencyNameOrKey.toLowerCase()) {
      return mapping.domainId
    }
  }
  
  return null
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

