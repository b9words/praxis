import { cleanupTestData } from './helpers/db-helper'

/**
 * Global teardown for E2E tests
 * Runs once after all tests to clean up the test environment
 */
async function globalTeardown() {
  console.log('🧹 Starting global test teardown...')
  
  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...')
    await cleanupTestData()
    console.log('✅ Test data cleaned up')
    
    console.log('🎉 Global teardown completed successfully!')
  } catch (error) {
    console.error('💥 Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown
