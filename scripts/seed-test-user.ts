import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

import { seedComprehensiveData } from '../lib/dev-seed'
import { prisma } from '../lib/prisma/server'

async function main() {
  // Find test user
  const testUser = await prisma.profile.findFirst({
    where: {
      OR: [
        { username: { contains: 'testuser' } },
        { username: { contains: 'user_' } },
      ],
    },
    select: {
      id: true,
      username: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (!testUser) {
    console.error('No test user found. Please create a test user first via dev tools.')
    process.exit(1)
  }

  console.log(`Found test user: ${testUser.username} (${testUser.id})`)
  console.log('Starting comprehensive seed...')

  try {
    const results = await seedComprehensiveData(testUser.id, 'user@praxis.test')
    
    console.log('\n✅ Seed completed!')
    console.log('Results:')
    console.log(`  - Competencies: ${results.competencies || 0}`)
    console.log(`  - Cases: ${results.cases || 0}`)
    console.log(`  - Articles: ${results.articles || 0}`)
    console.log(`  - Channels: ${results.channels || 0}`)
    console.log(`  - Simulations: ${results.simulations}`)
    console.log(`  - Debriefs: ${results.debriefs}`)
    console.log(`  - Article Progress: ${results.articleProgress}`)
    console.log(`  - Notifications: ${results.notifications}`)
    console.log(`  - Threads: ${results.threads}`)
    console.log(`  - Posts: ${results.posts}`)
    
    if (results.errors && results.errors.length > 0) {
      console.log(`\n⚠️  Errors (${results.errors.length}):`)
      results.errors.forEach((error: string) => {
        console.log(`  - ${error}`)
      })
    }
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

