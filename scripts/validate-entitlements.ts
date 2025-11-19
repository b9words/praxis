/**
 * Entitlements Validation Script
 * 
 * This script validates that subscription plans correctly gate content access
 * according to the plan definitions in lib/entitlements.ts
 * 
 * Usage:
 *   npx tsx scripts/validate-entitlements.ts
 * 
 * Prerequisites:
 *   - Test users with Explorer, Professional, and Executive subscriptions
 *   - Or provide user IDs via environment variables:
 *     - EXPLORER_USER_ID
 *     - PROFESSIONAL_USER_ID
 *     - EXECUTIVE_USER_ID
 */

import { prisma } from '../lib/prisma/server'
import { getUserEntitlements, canAccessDomain } from '../lib/entitlements'

// Domain mappings from lib/entitlements.ts
const YEAR_1_DOMAINS = [
  'second-order-decision-making',
  'organizational-design-talent-density',
]

const YEAR_2_DOMAINS = [
  'competitive-moat-architecture',
  'global-systems-thinking',
]

const YEAR_3_DOMAINS = [
  'high-stakes-dealmaking-integration',
]

const YEAR_4_DOMAINS = [
  'capital-allocation',
  'investor-market-narrative-control',
]

const YEAR_5_DOMAINS = [
  'crisis-leadership-public-composure',
  'geopolitical-regulatory-navigation',
  'technological-market-foresight',
]

interface TestResult {
  plan: string
  userId: string
  passed: boolean
  errors: string[]
}

async function validatePlan(userId: string, planName: 'Explorer' | 'Professional' | 'Executive'): Promise<TestResult> {
  const errors: string[] = []
  const entitlements = await getUserEntitlements(userId)

  // Verify plan name matches
  if (entitlements.planName !== planName) {
    errors.push(`Expected plan ${planName}, got ${entitlements.planName}`)
  }

  // Test Year 1 access (should be true for all plans)
  for (const domainId of YEAR_1_DOMAINS) {
    const canAccess = await canAccessDomain(userId, domainId)
    if (!canAccess) {
      errors.push(`Cannot access Year 1 domain: ${domainId}`)
    }
    if (!entitlements.canAccessYear1) {
      errors.push(`canAccessYear1 should be true for ${planName}`)
    }
  }

  // Test Year 2 access
  const shouldAccessYear2 = planName === 'Professional' || planName === 'Executive'
  if (entitlements.canAccessYear2 !== shouldAccessYear2) {
    errors.push(`canAccessYear2 should be ${shouldAccessYear2} for ${planName}`)
  }
  for (const domainId of YEAR_2_DOMAINS) {
    const canAccess = await canAccessDomain(userId, domainId)
    if (canAccess !== shouldAccessYear2) {
      errors.push(`Year 2 domain ${domainId}: expected ${shouldAccessYear2}, got ${canAccess}`)
    }
  }

  // Test Year 3 access
  const shouldAccessYear3 = planName === 'Professional' || planName === 'Executive'
  if (entitlements.canAccessYear3 !== shouldAccessYear3) {
    errors.push(`canAccessYear3 should be ${shouldAccessYear3} for ${planName}`)
  }
  for (const domainId of YEAR_3_DOMAINS) {
    const canAccess = await canAccessDomain(userId, domainId)
    if (canAccess !== shouldAccessYear3) {
      errors.push(`Year 3 domain ${domainId}: expected ${shouldAccessYear3}, got ${canAccess}`)
    }
  }

  // Test Year 4 access (Executive only)
  const shouldAccessYear4 = planName === 'Executive'
  if (entitlements.canAccessYear4 !== shouldAccessYear4) {
    errors.push(`canAccessYear4 should be ${shouldAccessYear4} for ${planName}`)
  }
  for (const domainId of YEAR_4_DOMAINS) {
    const canAccess = await canAccessDomain(userId, domainId)
    if (canAccess !== shouldAccessYear4) {
      errors.push(`Year 4 domain ${domainId}: expected ${shouldAccessYear4}, got ${canAccess}`)
    }
  }

  // Test Year 5 access (Executive only)
  const shouldAccessYear5 = planName === 'Executive'
  if (entitlements.canAccessYear5 !== shouldAccessYear5) {
    errors.push(`canAccessYear5 should be ${shouldAccessYear5} for ${planName}`)
  }
  for (const domainId of YEAR_5_DOMAINS) {
    const canAccess = await canAccessDomain(userId, domainId)
    if (canAccess !== shouldAccessYear5) {
      errors.push(`Year 5 domain ${domainId}: expected ${shouldAccessYear5}, got ${canAccess}`)
    }
  }

  // Test simulations access (all plans should have access)
  if (!entitlements.canAccessSimulations) {
    errors.push(`canAccessSimulations should be true for ${planName}`)
  }

  // Test advanced features (Professional and Executive)
  const shouldAccessAdvanced = planName === 'Professional' || planName === 'Executive'
  if (entitlements.canAccessAdvancedFeatures !== shouldAccessAdvanced) {
    errors.push(`canAccessAdvancedFeatures should be ${shouldAccessAdvanced} for ${planName}`)
  }

  // Test executive features (Executive only)
  const shouldAccessExecutive = planName === 'Executive'
  if (entitlements.canAccessExecutiveFeatures !== shouldAccessExecutive) {
    errors.push(`canAccessExecutiveFeatures should be ${shouldAccessExecutive} for ${planName}`)
  }

  return {
    plan: planName,
    userId,
    passed: errors.length === 0,
    errors,
  }
}

async function main() {
  console.log('🔍 Validating Entitlements...\n')

  // Get user IDs from environment or find test users
  const explorerUserId = process.env.EXPLORER_USER_ID
  const professionalUserId = process.env.PROFESSIONAL_USER_ID
  const executiveUserId = process.env.EXECUTIVE_USER_ID

  if (!explorerUserId || !professionalUserId || !executiveUserId) {
    console.log('⚠️  User IDs not provided via environment variables.')
    console.log('   Looking for test users with active subscriptions...\n')

    // Find users with active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      take: 10,
    })

    if (subscriptions.length === 0) {
      console.error('❌ No active subscriptions found.')
      console.error('   Please create test users with subscriptions or provide user IDs via:')
      console.error('   - EXPLORER_USER_ID')
      console.error('   - PROFESSIONAL_USER_ID')
      console.error('   - EXECUTIVE_USER_ID')
      process.exit(1)
    }

    // Try to match subscriptions to plans
    const explorerPlanId = process.env.NEXT_PUBLIC_PADDLE_PLAN_EXPLORER
    const professionalPlanId = process.env.NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL
    const executivePlanId = process.env.NEXT_PUBLIC_PADDLE_PLAN_EXECUTIVE

    const explorerSub = subscriptions.find(s => s.paddlePlanId === explorerPlanId)
    const professionalSub = subscriptions.find(s => s.paddlePlanId === professionalPlanId)
    const executiveSub = subscriptions.find(s => s.paddlePlanId === executivePlanId)

    if (!explorerSub || !professionalSub || !executiveSub) {
      console.error('❌ Could not find subscriptions for all three plans.')
      console.error('   Found subscriptions:', subscriptions.map(s => ({
        email: s.user.email,
        planId: s.paddlePlanId,
      })))
      console.error('\n   Please provide user IDs via environment variables.')
      process.exit(1)
    }

    const results = await Promise.all([
      validatePlan(explorerSub.userId, 'Explorer'),
      validatePlan(professionalSub.userId, 'Professional'),
      validatePlan(executiveSub.userId, 'Executive'),
    ])

    // Print results
    console.log('📊 Validation Results:\n')
    for (const result of results) {
      if (result.passed) {
        console.log(`✅ ${result.plan}: PASSED`)
      } else {
        console.log(`❌ ${result.plan}: FAILED`)
        for (const error of result.errors) {
          console.log(`   - ${error}`)
        }
      }
      console.log()
    }

    const allPassed = results.every(r => r.passed)
    if (allPassed) {
      console.log('🎉 All entitlements validated successfully!')
      process.exit(0)
    } else {
      console.error('❌ Some entitlements failed validation.')
      process.exit(1)
    }
  } else {
    // Use provided user IDs
    const results = await Promise.all([
      validatePlan(explorerUserId, 'Explorer'),
      validatePlan(professionalUserId, 'Professional'),
      validatePlan(executiveUserId, 'Executive'),
    ])

    // Print results
    console.log('📊 Validation Results:\n')
    for (const result of results) {
      if (result.passed) {
        console.log(`✅ ${result.plan}: PASSED`)
      } else {
        console.log(`❌ ${result.plan}: FAILED`)
        for (const error of result.errors) {
          console.log(`   - ${error}`)
        }
      }
      console.log()
    }

    const allPassed = results.every(r => r.passed)
    if (allPassed) {
      console.log('🎉 All entitlements validated successfully!')
      process.exit(0)
    } else {
      console.error('❌ Some entitlements failed validation.')
      process.exit(1)
    }
  }
}

main().catch((error) => {
  console.error('❌ Error running validation:', error)
  process.exit(1)
})

