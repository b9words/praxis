import { test } from '@playwright/test'

test.describe('Detailed Signup Test', () => {
  test('signup and check what happens next', async ({ page }) => {
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
    
    // Wait for any navigation or response
    await page.waitForTimeout(5000)
    
    console.log('Current URL after signup:', page.url())
    console.log('Page title:', await page.title())
    
    // Check what's on the page
    const pageContent = await page.textContent('body')
    console.log('Page content preview:', pageContent?.substring(0, 500))
    
    // Check for specific elements
    const emailSentMessage = page.locator('text=/Check your email/i')
    const errorMessage = page.locator('text=/error/i')
    const successMessage = page.locator('text=/success/i')
    
    if (await emailSentMessage.isVisible()) {
      console.log('Email confirmation required')
    } else if (await errorMessage.isVisible()) {
      console.log('Error occurred:', await errorMessage.textContent())
    } else if (await successMessage.isVisible()) {
      console.log('Success message:', await successMessage.textContent())
    } else {
      console.log('No clear success/error message found')
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/detailed-signup-result.png' })
  })
})
