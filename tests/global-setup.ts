import { chromium, FullConfig } from '@playwright/test'
import { createOrGetTestUser } from './helpers/supabase-admin'
import { seedTestUserData } from './helpers/seed'
import { prisma } from '@/lib/prisma/server'

/**
 * Global setup for Playwright tests
 * Creates test user and seeds comprehensive data
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up test environment...')

  try {
    // Create or get test user
    console.log('👤 Creating test user...')
    const userId = await createOrGetTestUser('e2e.user@execemy.test', 'Test1234!', 'e2e_user')
    console.log(`✅ Test user created/verified: ${userId}`)

    // Ensure user has residency
    let residency = await prisma.userResidency.findUnique({
      where: { userId },
    })

    if (!residency) {
      console.log('📚 Creating user residency...')
      await prisma.userResidency.create({
        data: {
          userId,
          currentResidency: 1,
        },
      })
      console.log('✅ User residency created')
    }

    // Seed comprehensive data
    console.log('🌱 Seeding test data...')
    await seedTestUserData(userId, 'e2e.user@execemy.test')
    console.log('✅ Test data seeded')

    // Store user ID in environment for tests to use
    process.env.TEST_USER_ID = userId
    process.env.TEST_USER_EMAIL = 'e2e.user@execemy.test'
    process.env.TEST_USER_PASSWORD = 'Test1234!'

    console.log('✅ Global setup complete')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export default globalSetup


