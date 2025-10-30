import { chromium, FullConfig } from '@playwright/test'
import { setupTestDatabase } from './helpers/db-helper'

/**
 * Global setup for E2E tests
 * Runs once before all tests to prepare the test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...')
  
  try {
    // Setup test database
    console.log('📊 Setting up test database...')
    await setupTestDatabase()
    console.log('✅ Test database ready')
    
    // Verify application is running
    console.log('🌐 Verifying application is running...')
    const browser = await chromium.launch()
    const page = await browser.newPage()
    
    try {
      await page.goto(config.use?.baseURL || 'http://localhost:3400', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      console.log('✅ Application is running and accessible')
    } catch (error) {
      console.error('❌ Application is not accessible:', error)
      throw error
    } finally {
      await browser.close()
    }
    
    console.log('🎉 Global setup completed successfully!')
  } catch (error) {
    console.error('💥 Global setup failed:', error)
    throw error
  }
}

export default globalSetup
