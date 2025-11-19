/**
 * Data Retention Cleanup Script
 * 
 * This script cleans up old data according to retention policies.
 * Run monthly via cron job or manually.
 * 
 * Usage:
 *   tsx scripts/cleanup-old-data.ts [--dry-run]
 * 
 * Options:
 *   --dry-run: Show what would be deleted without actually deleting
 */

import { prisma } from '../lib/prisma/server'

interface CleanupStats {
  inactiveUsers: number
  oldAnalytics: number
  oldDebriefs: number
  errors: string[]
}

async function cleanupOldData(dryRun: boolean = false): Promise<CleanupStats> {
  const stats: CleanupStats = {
    inactiveUsers: 0,
    oldAnalytics: 0,
    oldDebriefs: 0,
    errors: [],
  }

  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)

  const fiveYearsAgo = new Date()
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

  console.log('🧹 Starting data cleanup...')
  console.log(`   Dry run: ${dryRun ? 'YES' : 'NO'}`)
  console.log(`   Cutoff dates:`)
  console.log(`   - Inactive users: ${threeYearsAgo.toISOString()}`)
  console.log(`   - Old debriefs: ${fiveYearsAgo.toISOString()}`)
  console.log('')

  // 1. Find inactive users (no activity in 3 years)
  // Note: This is a simplified check - in production, you'd want more sophisticated logic
  try {
    const inactiveUsers = await prisma.profile.findMany({
      where: {
        updatedAt: { lt: threeYearsAgo },
        // Additional checks could include:
        // - No recent simulations
        // - No recent lesson progress
        // - No recent logins
      },
      select: {
        id: true,
        username: true,
        updatedAt: true,
      },
      take: 100, // Limit to prevent large operations
    })

    stats.inactiveUsers = inactiveUsers.length

    if (!dryRun && inactiveUsers.length > 0) {
      console.log(`⚠️  Found ${inactiveUsers.length} inactive users (not deleting - manual review required)`)
      // In production, you might want to:
      // - Anonymize user data
      // - Delete after grace period
      // - Send notification before deletion
    } else if (dryRun) {
      console.log(`📋 Would process ${inactiveUsers.length} inactive users`)
    }
  } catch (error) {
    const errorMsg = `Error finding inactive users: ${error instanceof Error ? error.message : 'Unknown error'}`
    stats.errors.push(errorMsg)
    console.error(`❌ ${errorMsg}`)
  }

  // 2. Clean up old debriefs (older than 5 years)
  // Note: This is conservative - debriefs are valuable user data
  // Consider archiving instead of deleting
  try {
    const oldDebriefs = await prisma.debrief.findMany({
      where: {
        createdAt: { lt: fiveYearsAgo },
      },
      select: {
        id: true,
        createdAt: true,
      },
      take: 1000, // Limit batch size
    })

    stats.oldDebriefs = oldDebriefs.length

    if (!dryRun && oldDebriefs.length > 0) {
      console.log(`⚠️  Found ${oldDebriefs.length} old debriefs (not deleting - consider archiving instead)`)
      // In production, you might want to:
      // - Archive to cold storage
      // - Keep summary data
      // - Delete only if user explicitly requests
    } else if (dryRun) {
      console.log(`📋 Would process ${oldDebriefs.length} old debriefs`)
    }
  } catch (error) {
    const errorMsg = `Error finding old debriefs: ${error instanceof Error ? error.message : 'Unknown error'}`
    stats.errors.push(errorMsg)
    console.error(`❌ ${errorMsg}`)
  }

  // 3. Note: Analytics data cleanup is handled by PostHog/Sentry retention policies
  // Token usage records could be cleaned up here if needed

  console.log('')
  console.log('✅ Cleanup complete!')
  console.log(`   Stats:`)
  console.log(`   - Inactive users found: ${stats.inactiveUsers}`)
  console.log(`   - Old debriefs found: ${stats.oldDebriefs}`)
  console.log(`   - Errors: ${stats.errors.length}`)

  if (stats.errors.length > 0) {
    console.log('')
    console.log('⚠️  Errors encountered:')
    stats.errors.forEach((error) => console.log(`   - ${error}`))
  }

  return stats
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  try {
    await cleanupOldData(dryRun)
    process.exit(0)
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { cleanupOldData }

