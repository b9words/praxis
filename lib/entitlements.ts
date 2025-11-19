/**
 * Entitlements and access control
 * Centralized logic for determining what content/features users can access based on their subscription plan
 */

import { getUserSubscriptionStatus, SubscriptionStatus } from './auth/subscription'

export type PlanName = 'Explorer' | 'Professional' | 'Executive' | null

export interface UserEntitlements {
  planName: PlanName
  canAccessYear1: boolean
  canAccessYear2: boolean
  canAccessYear3: boolean
  canAccessYear4: boolean
  canAccessYear5: boolean
  canAccessSimulations: boolean
  canAccessAdvancedFeatures: boolean
  canAccessExecutiveFeatures: boolean
}

/**
 * Map domain ID to curriculum year
 * Based on the 5-year curriculum structure:
 * Year 1: Operator's Residency - Fundamentals (financial, operations, people)
 * Year 2: Strategist's Residency - Competitive strategy and market positioning
 * Year 3: Dealmaker's Residency - M&A and strategic transactions
 * Year 4: Financier's Residency - Capital allocation and investor relations
 * Year 5: Leader's Residency - Executive leadership, crisis, governance
 */
function getYearForDomain(domainId: string): 1 | 2 | 3 | 4 | 5 {
  // Year 1: Operator's Residency - Fundamentals
  const year1Domains = [
    'second-order-decision-making', // Financial fundamentals and decision-making
    'organizational-design-talent-density', // Operations and people management
  ]
  
  // Year 2: Strategist's Residency - Competitive strategy
  const year2Domains = [
    'competitive-moat-architecture', // Competitive strategy and moats
    'global-systems-thinking', // Market expansion and systems thinking
  ]
  
  // Year 3: Dealmaker's Residency - M&A and transactions
  const year3Domains = [
    'high-stakes-dealmaking-integration', // M&A, deals, partnerships
  ]
  
  // Year 4: Financier's Residency - Capital allocation and investor relations
  const year4Domains = [
    'capital-allocation', // Capital allocation mastery
    'investor-market-narrative-control', // Investor relations
  ]
  
  // Year 5: Leader's Residency - Executive leadership
  const year5Domains = [
    'crisis-leadership-public-composure', // Crisis leadership
    'geopolitical-regulatory-navigation', // Governance and geopolitical
    'technological-market-foresight', // Strategic foresight
  ]
  
  if (year1Domains.includes(domainId)) return 1
  if (year2Domains.includes(domainId)) return 2
  if (year3Domains.includes(domainId)) return 3
  if (year4Domains.includes(domainId)) return 4
  if (year5Domains.includes(domainId)) return 5
  
  // Default: assume Year 1 for unknown domains (fail open for launch)
  // This ensures new domains are accessible until explicitly mapped
  return 1
}

/**
 * Map Paddle plan ID to plan name
 */
function getPlanNameFromPlanId(planId: string | null | undefined): PlanName {
  if (!planId) return null
  
  const explorerPlanId = process.env.NEXT_PUBLIC_PADDLE_PLAN_EXPLORER
  const professionalPlanId = process.env.NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL
  const executivePlanId = process.env.NEXT_PUBLIC_PADDLE_PLAN_EXECUTIVE
  
  if (planId === explorerPlanId) return 'Explorer'
  if (planId === professionalPlanId) return 'Professional'
  if (planId === executivePlanId) return 'Executive'
  
  // Fallback: try to infer from plan ID string
  const planIdLower = planId.toLowerCase()
  if (planIdLower.includes('explorer')) return 'Explorer'
  if (planIdLower.includes('professional')) return 'Professional'
  if (planIdLower.includes('executive')) return 'Executive'
  
  return null
}

/**
 * Get user entitlements based on subscription status
 */
export async function getUserEntitlements(userId: string): Promise<UserEntitlements> {
  const subscriptionStatus = await getUserSubscriptionStatus(userId)
  
  if (!subscriptionStatus.isActive || !subscriptionStatus.hasSubscription) {
    return {
      planName: null,
      canAccessYear1: false,
      canAccessYear2: false,
      canAccessYear3: false,
      canAccessYear4: false,
      canAccessYear5: false,
      canAccessSimulations: false,
      canAccessAdvancedFeatures: false,
      canAccessExecutiveFeatures: false,
    }
  }
  
  // Get plan name from subscription
  // We need to fetch the subscription to get the plan ID
  const { prisma } = await import('./prisma/server')
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { paddlePlanId: true },
  })
  
  const planName = getPlanNameFromPlanId(subscription?.paddlePlanId || null)
  
  // Define entitlements by plan
  switch (planName) {
    case 'Explorer':
      return {
        planName: 'Explorer',
        canAccessYear1: true,
        canAccessYear2: false,
        canAccessYear3: false,
        canAccessYear4: false,
        canAccessYear5: false,
        canAccessSimulations: true,
        canAccessAdvancedFeatures: false,
        canAccessExecutiveFeatures: false,
      }
    
    case 'Professional':
      return {
        planName: 'Professional',
        canAccessYear1: true,
        canAccessYear2: true,
        canAccessYear3: true,
        canAccessYear4: false,
        canAccessYear5: false,
        canAccessSimulations: true,
        canAccessAdvancedFeatures: true,
        canAccessExecutiveFeatures: false,
      }
    
    case 'Executive':
      return {
        planName: 'Executive',
        canAccessYear1: true,
        canAccessYear2: true,
        canAccessYear3: true,
        canAccessYear4: true,
        canAccessYear5: true,
        canAccessSimulations: true,
        canAccessAdvancedFeatures: true,
        canAccessExecutiveFeatures: true,
      }
    
    default:
      // Unknown plan - default to Explorer level access
      return {
        planName: null,
        canAccessYear1: true,
        canAccessYear2: false,
        canAccessYear3: false,
        canAccessYear4: false,
        canAccessYear5: false,
        canAccessSimulations: true,
        canAccessAdvancedFeatures: false,
        canAccessExecutiveFeatures: false,
      }
  }
}

/**
 * Check if user can access content for a specific year
 */
export async function canAccessYear(userId: string, year: 1 | 2 | 3 | 4 | 5): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId)
  
  switch (year) {
    case 1:
      return entitlements.canAccessYear1
    case 2:
      return entitlements.canAccessYear2
    case 3:
      return entitlements.canAccessYear3
    case 4:
      return entitlements.canAccessYear4
    case 5:
      return entitlements.canAccessYear5
    default:
      return false
  }
}

/**
 * Check if user can access a specific domain
 */
export async function canAccessDomain(userId: string, domainId: string): Promise<boolean> {
  const entitlements = await getUserEntitlements(userId)
  const year = getYearForDomain(domainId)
  return canAccessYear(userId, year)
}

/**
 * Get the upgrade message for locked content
 */
export function getUpgradeMessage(requiredPlan: 'Professional' | 'Executive', currentPlan: PlanName): string {
  if (currentPlan === null) {
    return `Subscribe to ${requiredPlan} to unlock this content`
  }
  
  if (requiredPlan === 'Executive' && currentPlan === 'Explorer') {
    return 'Upgrade to Executive to unlock this content'
  }
  
  if (requiredPlan === 'Executive' && currentPlan === 'Professional') {
    return 'Upgrade to Executive to unlock this content'
  }
  
  if (requiredPlan === 'Professional' && currentPlan === 'Explorer') {
    return 'Upgrade to Professional to unlock this content'
  }
  
  return 'This content requires a higher plan'
}

