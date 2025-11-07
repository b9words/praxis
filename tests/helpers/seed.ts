import { seedComprehensiveData } from '@/lib/dev-seed'

/**
 * Seed comprehensive test data for a user
 * This calls the existing seedComprehensiveData function from lib/dev-seed.ts
 */
export async function seedTestUserData(userId: string, email?: string): Promise<void> {
  try {
    const results = await seedComprehensiveData(userId, email)

    if (results.errors && results.errors.length > 0) {
      console.warn('Seed completed with some errors:', results.errors)
    } else {
      console.log('Seed completed successfully:', {
        competencies: results.competencies,
        cases: results.cases,
        articles: results.articles,
        simulations: results.simulations,
        debriefs: results.debriefs,
        articleProgress: results.articleProgress,
        notifications: results.notifications,
      })
    }
  } catch (error) {
    console.error('Failed to seed test user data:', error)
    throw error
  }
}


