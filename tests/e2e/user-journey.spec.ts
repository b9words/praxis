import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'e2e.user@execemy.test'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!'

test.describe('E2E User Journey', () => {
  test('complete user journey with 20+ interactions', async ({ page }) => {
    // Set short timeouts for aggressive testing
    test.setTimeout(300000) // 5 minutes total

    // Action 1: Navigate to marketing homepage and click "Authenticate"
    await page.goto('/', { timeout: 10000 })
    await expect(page.locator('text=Execemy')).toBeVisible({ timeout: 5000 })
    
    const authenticateLink = page.locator('a:has-text("Authenticate")').first()
    await expect(authenticateLink).toBeVisible({ timeout: 5000 })
    await authenticateLink.click({ timeout: 5000 })

    // Action 2-4: Login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 })
    
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible({ timeout: 5000 })
    await emailInput.fill(TEST_EMAIL, { timeout: 5000 })

    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible({ timeout: 5000 })
    await passwordInput.fill(TEST_PASSWORD, { timeout: 5000 })

    const authenticateButton = page.locator('button:has-text("Authenticate")')
    await expect(authenticateButton).toBeVisible({ timeout: 5000 })
    await authenticateButton.click({ timeout: 5000 })

    // Wait for navigation after login
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 })

    // Action 5: Open navbar and click "Library"
    const libraryLink = page.locator('nav a:has-text("Library")').first()
    await expect(libraryLink).toBeVisible({ timeout: 5000 })
    await libraryLink.click({ timeout: 5000 })
    await page.waitForURL(/.*\/library/, { timeout: 10000 })

    // Action 6: Click "Explore Curriculum"
    const exploreCurriculumButton = page.locator('a:has-text("Explore Curriculum")').first()
    await expect(exploreCurriculumButton).toBeVisible({ timeout: 5000 })
    await exploreCurriculumButton.click({ timeout: 5000 })
    await page.waitForURL(/.*\/library\/curriculum/, { timeout: 10000 })

    // Action 7: Click first lesson card from "Recommended for You"
    const firstLessonCard = page.locator('a[href*="/library/curriculum/"]').first()
    await expect(firstLessonCard).toBeVisible({ timeout: 5000 })
    const lessonHref = await firstLessonCard.getAttribute('href')
    await firstLessonCard.click({ timeout: 5000 })
    
    // Wait for lesson page to load
    await page.waitForURL(/.*\/library\/curriculum\/.*\/.*\/.*/, { timeout: 10000 })
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 })

    // Action 8: Click bookmark button
    const bookmarkButton = page.locator('button[title="Save for future analysis"]')
    if (await bookmarkButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bookmarkButton.click({ timeout: 5000 })
      // Wait a moment for the bookmark to save
      await page.waitForTimeout(500)
    }

    // Action 9: Scroll lesson content
    const lessonContent = page.locator('div.prose, article, main').first()
    if (await lessonContent.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lessonContent.scrollIntoViewIfNeeded({ timeout: 5000 })
      await page.waitForTimeout(500)
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(500)
    }

    // Action 10: Type in reflection textarea and save
    const reflectionTextarea = page.locator('textarea[placeholder*="reflect"], textarea[placeholder*="Reflect"]').first()
    if (await reflectionTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reflectionTextarea.fill('This is a test reflection to verify the reflection saving functionality works correctly.', { timeout: 5000 })
      
      const saveReflectionButton = page.locator('button:has-text("Save Reflection")').first()
      if (await saveReflectionButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveReflectionButton.click({ timeout: 5000 })
        // Wait for save feedback
        await page.waitForTimeout(1000)
        // Verify save feedback appears (either toast or "Saved" text)
        const savedIndicator = page.locator('text=/Saved|saving/i').first()
        await expect(savedIndicator).toBeVisible({ timeout: 5000 })
      }
    }

    // Action 11: Click "NEXT" lesson button
    const nextButton = page.locator('a:has-text("NEXT"), button:has-text("NEXT")').first()
    if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const nextHref = await nextButton.getAttribute('href')
      if (nextHref && !nextHref.includes('#')) {
        await nextButton.click({ timeout: 5000 })
        await page.waitForURL(/.*\/library\/curriculum\/.*\/.*\/.*/, { timeout: 10000 })
        await page.waitForTimeout(1000) // Wait for page to settle
      }
    }

    // Action 12: Click "MODULE" breadcrumb
    const moduleBreadcrumb = page.locator('a:has-text("MODULE")').first()
    if (await moduleBreadcrumb.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moduleBreadcrumb.click({ timeout: 5000 })
      await page.waitForURL(/.*\/library\/curriculum\/.*\/.*/, { timeout: 10000 })
    }

    // Action 13: Use navbar to go to "Case Studies"
    const caseStudiesLink = page.locator('nav a:has-text("Case Studies")').first()
    await expect(caseStudiesLink).toBeVisible({ timeout: 5000 })
    await caseStudiesLink.click({ timeout: 5000 })
    await page.waitForURL(/.*\/library\/case-studies/, { timeout: 10000 })

    // Action 14: Click first case "Start Case Study" button
    const startButton = page.locator('a:has-text("Start Case Study"), a:has-text("Continue Case Study")').first()
    await expect(startButton).toBeVisible({ timeout: 5000 })
    await startButton.click({ timeout: 5000 })
    
    // Wait for overview page
    await page.waitForURL(/.*\/library\/case-studies\/.*/, { timeout: 10000 })

    // Action 15: On overview page, click "Start Case Study"
    const startFromOverviewButton = page.locator('a:has-text("Start Case Study"), a:has-text("Continue Case Study")').first()
    await expect(startFromOverviewButton).toBeVisible({ timeout: 5000 })
    await startFromOverviewButton.click({ timeout: 5000 })
    
    // Wait for tasks page
    await page.waitForURL(/.*\/library\/case-studies\/.*\/tasks/, { timeout: 10000 })
    await page.waitForTimeout(2000) // Wait for workspace to fully load

    // Action 16: Type ≥50 chars into "Your Analysis" textarea
    const justificationTextarea = page.locator('textarea#justification, textarea[placeholder*="Analysis"], textarea[placeholder*="reasoning"]').first()
    await expect(justificationTextarea).toBeVisible({ timeout: 10000 })
    
    const analysisText = 'This is a comprehensive analysis of the case study scenario. I have reviewed all the provided data and considered multiple strategic options. Based on the financial metrics and market conditions, I recommend proceeding with Option A because it provides the best risk-adjusted return while maintaining operational flexibility.'
    await justificationTextarea.fill(analysisText, { timeout: 5000 })

    // Action 17: Click "Submit & Continue" or "Submit Final Decision"
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Continue")').first()
    await expect(submitButton).toBeVisible({ timeout: 5000 })
    await expect(submitButton).toBeEnabled({ timeout: 5000 })
    await submitButton.click({ timeout: 5000 })

    // Action 18: If soft paywall modal appears, click "Continue without analysis"
    const paywallModal = page.locator('text=/Classified|debrief/i').first()
    if (await paywallModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const continueWithoutButton = page.locator('button:has-text("Continue without"), button:has-text("without analysis")').first()
      if (await continueWithoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await continueWithoutButton.click({ timeout: 5000 })
      }
    }

    // Wait a moment for any modals or transitions
    await page.waitForTimeout(1000)

    // Action 19: Open navbar menu and go to "Settings"
    // Find avatar button (Button with rounded-full class containing Avatar)
    const avatarButton = page.locator('button.rounded-full, button:has([class*="Avatar"])').first()
    if (await avatarButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await avatarButton.click({ timeout: 5000 })
      await page.waitForTimeout(500)
      
      // Click Settings link in dropdown
      const settingsLink = page.locator('a:has-text("Settings"), a[href*="/profile/edit"]').first()
      if (await settingsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await settingsLink.click({ timeout: 5000 })
      } else {
        // Fallback: navigate directly
        await page.goto('/profile/edit', { timeout: 10000 })
      }
    } else {
      // Fallback: navigate directly
      await page.goto('/profile/edit', { timeout: 10000 })
    }
    
    await page.waitForURL(/.*\/profile\/edit/, { timeout: 10000 })

    // Action 20: Edit profile fields and save
    const usernameInput = page.locator('input#username, input[name="username"]').first()
    if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await usernameInput.clear({ timeout: 5000 })
      await usernameInput.fill('e2e_user_updated', { timeout: 5000 })
    }

    const fullNameInput = page.locator('input#fullName, input[name="fullName"]').first()
    if (await fullNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fullNameInput.clear({ timeout: 5000 })
      await fullNameInput.fill('E2E Test User Updated', { timeout: 5000 })
    }

    const bioTextarea = page.locator('textarea#bio, textarea[name="bio"]').first()
    if (await bioTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bioTextarea.fill('This is an updated bio from E2E testing.', { timeout: 5000 })
    }

    const saveChangesButton = page.locator('button:has-text("Save Changes")').first()
    await expect(saveChangesButton).toBeVisible({ timeout: 5000 })
    await saveChangesButton.click({ timeout: 5000 })

    // Wait for redirect to profile page
    await page.waitForURL(/.*\/profile\/.*/, { timeout: 10000 })
    
    // Verify we're on the profile page
    const profilePage = page.locator('h1, h2').filter({ hasText: /Profile|E2E/i }).first()
    await expect(profilePage).toBeVisible({ timeout: 5000 })

    // Action 21: Navigate to community and join waitlist
    await page.goto('/community', { timeout: 10000 })
    await page.waitForTimeout(1000)
    
    const joinWaitlistButton = page.locator('button:has-text("Join"), button:has-text("Waitlist")').first()
    if (await joinWaitlistButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await joinWaitlistButton.click({ timeout: 5000 })
      await page.waitForTimeout(2000) // Wait for toast/state update
      
      // Verify success (toast or state change)
      const successIndicator = page.locator('text=/on the list|waitlist|success/i').first()
      await expect(successIndicator).toBeVisible({ timeout: 5000 })
    }

    // Action 22: Navigate to residency and select Year 1
    await page.goto('/residency', { timeout: 10000 })
    await page.waitForTimeout(1000)
    
    const year1SelectButton = page.locator('button:has-text("Select Path")').first()
    if (await year1SelectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await year1SelectButton.click({ timeout: 5000 })
      await page.waitForTimeout(2000) // Wait for state update
      
      // Verify "Current" badge appears
      const currentBadge = page.locator('text=/Current|Selected/i').first()
      await expect(currentBadge).toBeVisible({ timeout: 5000 })
    }

    // Action 23: Open navbar and sign out
    const avatarButton2 = page.locator('button.rounded-full, button:has([class*="Avatar"])').first()
    if (await avatarButton2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await avatarButton2.click({ timeout: 5000 })
      await page.waitForTimeout(500)
      
      const signOutButton = page.locator('button:has-text("Sign out"), [role="menuitem"]:has-text("Sign out")').first()
      if (await signOutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signOutButton.click({ timeout: 5000 })
        await page.waitForTimeout(2000) // Wait for sign out
      }
    }

    // Action 24: Navigate to login and log back in
    await page.goto('/login', { timeout: 10000 })
    
    await emailInput.fill(TEST_EMAIL, { timeout: 5000 })
    await passwordInput.fill(TEST_PASSWORD, { timeout: 5000 })
    await authenticateButton.click({ timeout: 5000 })

    // Wait for navigation after login
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 })

    // Verify navbar is visible (user is logged in)
    const navbar = page.locator('nav, [role="navigation"]').first()
    await expect(navbar).toBeVisible({ timeout: 5000 })
  })
})

