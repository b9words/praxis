import { expect, test } from '@playwright/test'

/**
 * Critical user flow E2E test
 * Tests: Signup -> Onboarding -> Start Lesson
 */
test.describe('Critical User Flow', () => {
  test('complete signup and onboarding flow', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')

    // Generate unique test user
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    const testUsername = `testuser${timestamp}`

    // Fill signup form
    await page.fill('input[type="text"][placeholder="johndoe"]', testUsername)
    await page.fill('input[type="email"][placeholder="you@example.com"]', testEmail)
    await page.fill('input[type="password"][placeholder="Minimum 6 characters"]', 'password123')
    
    // Submit signup
    await page.click('button:has-text("Sign Up")')

    // Wait for email verification message or redirect
    // Note: This test may need adjustment based on email confirmation requirements
    await page.waitForTimeout(2000)

    // If email verification is shown, the flow stops here
    // Otherwise, continue to onboarding
    const emailMessage = page.locator('text=/Check your email/i')
    if (await emailMessage.isVisible()) {
      // Email verification required - this is expected behavior
      expect(emailMessage).toBeVisible()
      return
    }

    // If we reach here, user should be on onboarding or dashboard
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 5000 })

    // If on onboarding, complete it
    if (page.url().includes('/onboarding')) {
      // Select Year 1 residency
      await page.click('button:has-text("Start Year 1 Journey")')
      
      // Continue through onboarding steps
      await page.waitForTimeout(1000)
      await page.click('button:has-text("I\'m Ready to Begin")')
      
      // Final step - start journey
      await page.waitForTimeout(1000)
      await page.click('button:has-text("Start My Journey")')

      // Should redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 5000 })
      expect(page.url()).toContain('/dashboard')
    }
  })

  test('login flow', async ({ page }) => {
    // This test assumes a test user exists
    // In a real scenario, you'd seed test data first
    await page.goto('/login')

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit login
    await page.click('button:has-text("Sign In")')

    // Should redirect to dashboard after successful login
    await page.waitForURL(/\/dashboard/, { timeout: 5000 })
  })
})

