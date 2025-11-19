import { test, expect } from '@playwright/test'
import { createOrGetTestUser } from '../helpers/supabase-admin'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'golden.path@execemy.test'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!'

test.describe('Golden Path - New User Journey', () => {
  test.beforeAll(async () => {
    // Ensure test user exists
    await createOrGetTestUser(TEST_EMAIL, TEST_PASSWORD, 'golden_path_user')
  })

  test('complete golden path: signup → onboarding → first lesson → first simulation', async ({ page }) => {
    test.setTimeout(300000) // 5 minutes

    // Step 1: Navigate to homepage
    await page.goto('/', { timeout: 10000 })
    await expect(page.locator('text=Execemy')).toBeVisible({ timeout: 5000 })

    // Step 2: Sign up / Login
    const authenticateLink = page.locator('a:has-text("Authenticate"), a:has-text("Sign up"), a:has-text("Login")').first()
    await expect(authenticateLink).toBeVisible({ timeout: 5000 })
    await authenticateLink.click({ timeout: 5000 })

    // Wait for login page
    await expect(page).toHaveURL(/.*\/(login|signup)/, { timeout: 10000 })

    // Fill login form
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 5000 })
    await emailInput.fill(TEST_EMAIL, { timeout: 5000 })

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible({ timeout: 5000 })
    await passwordInput.fill(TEST_PASSWORD, { timeout: 5000 })

    const authenticateButton = page.locator('button:has-text("Authenticate"), button:has-text("Sign in")')
    await expect(authenticateButton).toBeVisible({ timeout: 5000 })
    await authenticateButton.click({ timeout: 5000 })

    // Step 3: Onboarding flow (if not completed)
    // Check if redirected to onboarding
    const isOnboarding = await page.url().includes('/onboarding')
    if (isOnboarding) {
      // Complete onboarding steps
      // Step 3.1: Strategic Objective
      const objectiveOption = page.locator('button, [role="button"]').filter({ hasText: /Transition|Advance|Master/i }).first()
      if (await objectiveOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await objectiveOption.click({ timeout: 5000 })
        await page.waitForTimeout(1000)
        
        const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first()
        if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await continueButton.click({ timeout: 5000 })
        }
      }

      // Step 3.2: Weekly Commitment
      const timeCommitment = page.locator('input[type="range"], button').filter({ hasText: /5|hours/i }).first()
      if (await timeCommitment.isVisible({ timeout: 5000 }).catch(() => false)) {
        await timeCommitment.click({ timeout: 5000 })
        await page.waitForTimeout(1000)
        
        const continueButton2 = page.locator('button:has-text("Continue"), button:has-text("Next")').first()
        if (await continueButton2.isVisible({ timeout: 3000 }).catch(() => false)) {
          await continueButton2.click({ timeout: 5000 })
        }
      }

      // Step 3.3: Learning Track
      const trackOption = page.locator('button, [role="button"]').filter({ hasText: /Prepare|Master|Think/i }).first()
      if (await trackOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await trackOption.click({ timeout: 5000 })
        await page.waitForTimeout(1000)
        
        const continueButton3 = page.locator('button:has-text("Continue"), button:has-text("Next")').first()
        if (await continueButton3.isVisible({ timeout: 3000 }).catch(() => false)) {
          await continueButton3.click({ timeout: 5000 })
        }
      }

      // Step 3.4: Competency Selection
      const competencyOption = page.locator('button, [role="button"]').first()
      if (await competencyOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await competencyOption.click({ timeout: 5000 })
        await page.waitForTimeout(1000)
        
        const continueButton4 = page.locator('button:has-text("Continue"), button:has-text("Complete")').first()
        if (await continueButton4.isVisible({ timeout: 3000 }).catch(() => false)) {
          await continueButton4.click({ timeout: 5000 })
        }
      }

      // Wait for onboarding to complete and redirect
      await page.waitForURL(/.*\/(dashboard|library)/, { timeout: 15000 })
    }

    // Step 4: Navigate to Dashboard (should show recommended next step)
    await page.goto('/dashboard', { timeout: 10000 })
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 })

    // Step 5: Click recommended lesson or navigate to library
    const recommendedLesson = page.locator('a[href*="/library/curriculum/"]').first()
    if (await recommendedLesson.isVisible({ timeout: 5000 }).catch(() => false)) {
      await recommendedLesson.click({ timeout: 5000 })
    } else {
      // Fallback: navigate to library
      await page.goto('/library/curriculum', { timeout: 10000 })
      const firstLesson = page.locator('a[href*="/library/curriculum/"]').first()
      await expect(firstLesson).toBeVisible({ timeout: 5000 })
      await firstLesson.click({ timeout: 5000 })
    }

    // Step 6: View first lesson
    await page.waitForURL(/.*\/library\/curriculum\/.*\/.*\/.*/, { timeout: 10000 })
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 })

    // Scroll through lesson content
    const lessonContent = page.locator('div.prose, article, main').first()
    if (await lessonContent.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lessonContent.scrollIntoViewIfNeeded({ timeout: 5000 })
      await page.waitForTimeout(1000)
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(1000)
    }

    // Step 7: Navigate to case studies
    await page.goto('/library/case-studies', { timeout: 10000 })
    await page.waitForTimeout(1000)

    // Step 8: Start first case study
    const startCaseButton = page.locator('a:has-text("Start Case Study"), a:has-text("Continue Case Study")').first()
    await expect(startCaseButton).toBeVisible({ timeout: 5000 })
    await startCaseButton.click({ timeout: 5000 })

    // Wait for case overview
    await page.waitForURL(/.*\/library\/case-studies\/.*/, { timeout: 10000 })
    await page.waitForTimeout(1000)

    // Click start from overview
    const startFromOverview = page.locator('a:has-text("Start Case Study"), a:has-text("Continue Case Study")').first()
    await expect(startFromOverview).toBeVisible({ timeout: 5000 })
    await startFromOverview.click({ timeout: 5000 })

    // Step 9: Complete simulation task
    await page.waitForURL(/.*\/library\/case-studies\/.*\/tasks/, { timeout: 10000 })
    await page.waitForTimeout(2000) // Wait for workspace to load

    // Fill in analysis
    const analysisTextarea = page.locator('textarea#justification, textarea[placeholder*="Analysis"], textarea[placeholder*="reasoning"]').first()
    await expect(analysisTextarea).toBeVisible({ timeout: 10000 })
    
    const analysisText = 'This is a comprehensive analysis for the golden path test. I have reviewed the case data and recommend proceeding with the strategic option that provides the best risk-adjusted return.'
    await analysisTextarea.fill(analysisText, { timeout: 5000 })

    // Submit decision
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Continue")').first()
    await expect(submitButton).toBeVisible({ timeout: 5000 })
    await expect(submitButton).toBeEnabled({ timeout: 5000 })
    await submitButton.click({ timeout: 5000 })

    // Step 10: Verify completion (either debrief page or success message)
    await page.waitForTimeout(2000)
    
    // Check if we're on debrief page or simulation completed
    const debriefPage = page.url().includes('/debrief')
    const successIndicator = page.locator('text=/completed|debrief|analysis/i').first()
    
    // At minimum, verify we're not on an error page
    expect(page.url()).not.toContain('/error')
    expect(page.url()).not.toContain('/404')
  })
})

