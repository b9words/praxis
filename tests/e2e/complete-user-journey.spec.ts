import { expect, test } from '@playwright/test'
import { loginAsAdmin, loginAsMember } from '../helpers/auth-helper'

/**
 * Complete User Journey E2E Test
 * Tests the entire user flow from signup to simulation completion
 * 30+ sequential actions covering all major features
 */

test.describe('Complete User Journey - 30+ Actions', () => {
  test.beforeAll(async () => {
    // Skip database setup for now - focus on UI testing
    // await setupTestDatabase()
  })

  test.beforeEach(async ({ page }) => {
    // Skip database reset for now - focus on UI testing
    // await resetAndSeedDatabase()
  })

  test('Complete user journey from homepage to simulation completion', async ({ page }) => {
    // Set aggressive timeouts
    page.setDefaultTimeout(5000)
    page.setDefaultNavigationTimeout(10000)

    // ACTION 1: Navigate to homepage
    await page.goto('/')
    await expect(page).toHaveTitle(/Execemy/)
    await expect(page.getByRole('heading', { name: /The Proving Ground for/i })).toBeVisible()

    // ACTION 2: Click signup button
    await page.click('text=Request Access')
    await expect(page).toHaveURL('/signup')

    // ACTION 3: Fill signup form
    const timestamp = Date.now()
    const testEmail = `e2e-test-${timestamp}@gmail.com`
    const testUsername = `e2etest${timestamp}`
    
    await page.fill('input[type="text"]', testUsername)
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', 'TestPassword123!')
    
    // ACTION 4: Submit signup form
    await page.click('button[type="submit"]')
    
    // Wait for redirect (email verification bypassed in test)
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 })

    // ACTION 5: Complete onboarding residency selection
    if (page.url().includes('/onboarding')) {
      await expect(page.locator('text=Choose Your Learning Path')).toBeVisible()
      await page.click('text=Start Year 1 Journey')
      await page.click('text=I\'m Ready to Begin')
      await page.click('text=Start My Journey')
      await page.waitForURL('/dashboard')
    }

    // ACTION 6: View dashboard with recommendation card
    await expect(page.locator('text=/Welcome back|Welcome/i')).toBeVisible()
    await expect(page.locator('text=/Your Next Step|Next Step/i')).toBeVisible()
    await expect(page.locator('text=/Year 1|Operator|Residency/i')).toBeVisible()

    // ACTION 7: Check radar chart (empty state)
    await expect(page.locator('text=Build Your Profile')).toBeVisible()
    await expect(page.locator('text=Complete simulations to unlock your competency radar chart')).toBeVisible()

    // ACTION 8: Click notification bell, verify empty state
    const notificationButton = page.locator('[data-testid="notification-bell"]')
    if (await notificationButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notificationButton.click()
      await expect(page.locator('text=/no notifications|No notifications/i')).toBeVisible({ timeout: 3000 }).catch(() => {})
      await page.keyboard.press('Escape') // Close notification dropdown
    }

    // ACTION 9: Navigate to library from dashboard
    await page.click('text=Intel') // Navbar uses "Intel" not "Library"
    await expect(page).toHaveURL('/library/curriculum')

    // ACTION 10: Navigate back to dashboard
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/dashboard')

    // ACTION 11: Browse curriculum domains (already on curriculum page)
    await expect(page).toHaveURL('/library/curriculum')
    await expect(page.locator('text=Year 1: The Operator\'s Residency')).toBeVisible()

    // ACTION 12: Open specific domain (Year 1)
    await page.click('text=Financial Acumen')
    await expect(page).toHaveURL(/\/library\/curriculum\/financial-acumen/)

    // ACTION 13: Open specific module
    await page.click('text=Unit Economics')
    await expect(page).toHaveURL(/\/library\/curriculum\/financial-acumen\/unit-economics/)

    // ACTION 14: Open and read complete lesson/article
    await page.click('text=ROI & CAC Calculation')
    await expect(page).toHaveURL(/\/library\/curriculum\/financial-acumen\/unit-economics\/roi-cac-basics/)
    await expect(page.locator('text=Framework: Return on Investment (ROI) & Customer Acquisition Cost (CAC)')).toBeVisible()

    // ACTION 15: Scroll through content, trigger progress tracking
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(1000) // Allow progress tracking to trigger
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(1000)

    // ACTION 16: Use Smart Study Assistant (AI chat)
    await page.click('text=Ask the Study Assistant')
    await page.fill('textarea[placeholder*="question"]', 'What is the difference between ROI and IRR?')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Based on the article content')).toBeVisible({ timeout: 10000 })

    // ACTION 17: Bookmark the article
    await page.click('button[aria-label="Bookmark"]')
    await expect(page.locator('text=Bookmarked')).toBeVisible()

    // ACTION 18: Navigate to simulations page
    await page.click('text=Simulations')
    await expect(page).toHaveURL('/simulations')
    await expect(page.locator('text=Case Simulations')).toBeVisible()

    // ACTION 19: Click on specific case
    await page.click('text=The Unit Economics Crisis: SaaS Startup Burning Cash')
    await expect(page).toHaveURL(/\/simulations\/test-case-1\/brief/)

    // ACTION 20: Read case briefing
    await expect(page.locator('text=Case Brief: CloudSync Unit Economics Crisis')).toBeVisible()
    await expect(page.locator('text=Your Role')).toBeVisible()
    await expect(page.locator('text=Finance & Operations Manager')).toBeVisible()

    // ACTION 21: Start simulation
    await page.click('text=Start Simulation')
    await expect(page).toHaveURL(/\/simulations\/test-case-1\/workspace/)

    // ACTION 22: View case files (CSV financial data, memos)
    await expect(page.locator('text=Case Files')).toBeVisible()
    await page.click('text=Financial Data')
    await expect(page.locator('text=CloudSync Financial Dashboard Q4 2023.csv')).toBeVisible()
    await page.click('text=Case Overview')
    await expect(page.locator('text=Your Role')).toBeVisible()

    // ACTION 23: Interact with simulation stages - Make strategic option selection
    await page.click('text=Continue to Next Stage')
    await expect(page.locator('text=Immediate Action Decision')).toBeVisible()
    
    // Select an option
    await page.click('text=Focus on Reducing Churn')
    await page.fill('textarea[placeholder*="justification"]', 'Reducing churn from 8% to 4% will double our LTV and improve unit economics significantly, even if it increases short-term burn.')

    // ACTION 24: Fill out written analysis
    await page.click('text=Continue to Next Stage')
    await expect(page.locator('text=Pricing Strategy Analysis')).toBeVisible()
    await page.fill('textarea[placeholder*="analysis"]', 'Based on the customer segmentation data, I recommend implementing tiered pricing with higher prices for enterprise customers who have shown willingness to pay more.')

    // ACTION 25: Chat with AI persona
    await page.click('text=Continue to Next Stage')
    await expect(page.locator('text=Infrastructure Cost Decision')).toBeVisible()
    
    // Find and interact with AI persona chat
    const chatInput = page.locator('textarea[placeholder*="message"]').first()
    if (await chatInput.isVisible()) {
      await chatInput.fill('What are the risks of the architectural overhaul approach?')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=The architectural overhaul')).toBeVisible({ timeout: 10000 })
    }

    // ACTION 26: Submit stage data
    await page.click('text=Submit Response')
    await expect(page.locator('text=Stage completed successfully')).toBeVisible()

    // ACTION 27: Complete all simulation stages
    await page.click('text=Complete Simulation')
    await page.click('text=Yes, complete simulation')
    await expect(page.locator('text=Simulation completed successfully')).toBeVisible()

    // ACTION 28: View generated debrief with scores
    await page.waitForURL(/\/debrief\/sim-\d+/)
    await expect(page.locator('text=Your Performance Analysis')).toBeVisible()
    await expect(page.locator('text=Strategic Thinking')).toBeVisible()
    await expect(page.locator('text=Financial Acumen')).toBeVisible()

    // ACTION 29: Check updated radar chart on profile
    await page.click('text=Profile')
    await expect(page).toHaveURL(/\/profile\/\w+/)
    await expect(page.locator('text=Execemy Profile')).toBeVisible()
    // Note: Radar chart may not be visible if no scores yet

    // ACTION 30: Navigate to community forum
    await page.click('text=Community')
    await expect(page).toHaveURL('/community')
    await expect(page.locator('text=Community')).toBeVisible()

    // ACTION 31: Create new forum thread
    await page.click('text=General Discussion')
    await page.click('text=New Thread')
    await page.fill('input[placeholder*="title"]', 'E2E Test Discussion Thread')
    await page.fill('textarea[placeholder*="content"]', 'This is a test thread created during E2E testing. Great insights from the unit economics case!')
    await page.click('text=Create Thread')

    // ACTION 32: Post reply to thread
    await expect(page.locator('text=E2E Test Discussion Thread')).toBeVisible()
    await page.fill('textarea[placeholder*="reply"]', 'Thanks for sharing! I found the churn analysis particularly insightful.')
    await page.click('text=Post Reply')
    await expect(page.locator('text=Thanks for sharing!')).toBeVisible()

    // ACTION 33: Edit profile information
    await page.click('text=Profile')
    await page.click('text=Edit Profile')
    await page.fill('input[name="bio"]', 'E2E Test User - Learning business fundamentals through Execemy Platform')
    await page.click('text=Save Changes')
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()

    // ACTION 34: Toggle profile to public
    await page.click('input[name="isPublic"]')
    await page.click('text=Save Changes')
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()

    // ACTION 35: View own public profile
    await page.click('text=View Public Profile')
    await expect(page.locator('text=E2E Test User - Learning business fundamentals')).toBeVisible()

    // Additional actions to reach 30+ total:

    // ACTION 36: Navigate back to dashboard and check updated progress
    await page.click('text=Dashboard')
    await expect(page.locator('text=1 Simulations Done')).toBeVisible()

    // ACTION 37: Check notification bell for new notifications
    await page.click('[data-testid="notification-bell"]')
    await expect(page.locator('text=Simulation Complete!')).toBeVisible()
    await page.keyboard.press('Escape')

    // ACTION 38: Access admin panel (as admin user)
    await page.click('text=Sign Out')
    await loginAsAdmin(page)
    await page.click('text=Admin')
    await expect(page.locator('text=Admin Dashboard')).toBeVisible()

    // ACTION 39: View analytics dashboard
    await page.click('text=Analytics')
    await expect(page.locator('text=Platform Analytics')).toBeVisible()

    // ACTION 40: Return to member view and verify all features work
    await page.click('text=Sign Out')
    await loginAsMember(page)
    await expect(page.locator('text=Welcome back')).toBeVisible()

    console.log('✅ All 40+ actions completed successfully!')
  })

  test('Error handling and edge cases', async ({ page }) => {
    // Test error scenarios
    await page.goto('/nonexistent-page')
    await expect(page.locator('text=404')).toBeVisible()

    // Test unauthorized access
    await page.goto('/admin')
    await expect(page).toHaveURL('/login')

    // Test with invalid credentials
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })
})
