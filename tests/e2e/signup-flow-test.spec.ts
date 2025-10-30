import { test } from '@playwright/test'

test.describe('Signup Flow Test', () => {
  test('complete signup process', async ({ page }) => {
    await page.goto('/signup')
    
    const timestamp = Date.now()
    const testEmail = `e2e-test-${timestamp}@gmail.com`
    const testUsername = `e2euser${timestamp}`
    
    console.log('Filling signup form...')
    
    // Fill signup form
    await page.fill('input[id="username"]', testUsername)
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', 'SecurePassword123!')
    
    console.log('Submitting signup form...')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for navigation or error message
    await page.waitForTimeout(3000)
    
    console.log('Current URL after signup:', page.url())
    console.log('Page title:', await page.title())
    
    // Check for success indicators
    const successMessage = page.locator('text=/Check your email|verify your email|success/i')
    const errorMessage = page.locator('text=/error|invalid|failed/i')
    
    if (await successMessage.isVisible()) {
      console.log('Success message found:', await successMessage.textContent())
    } else if (await errorMessage.isVisible()) {
      console.log('Error message found:', await errorMessage.textContent())
    } else {
      console.log('No success or error message found')
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/signup-result.png' })
  })
})
