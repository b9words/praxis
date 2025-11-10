import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'e2e.user@execemy.test'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!'

test.describe('Case Studies Route Redirects', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login', { timeout: 10000 })
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill(TEST_EMAIL, { timeout: 5000 })
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.fill(TEST_PASSWORD, { timeout: 5000 })
    const authenticateButton = page.locator('button:has-text("Authenticate")')
    await authenticateButton.click({ timeout: 5000 })
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 })
  })

  test('redirects /case-studies to /library/case-studies', async ({ page }) => {
    await page.goto('/case-studies', { timeout: 10000 })
    await expect(page).toHaveURL(/.*\/library\/case-studies/, { timeout: 10000 })
  })

  test('redirects /case-studies/:caseId to /library/case-studies/:caseId', async ({ page }) => {
    // First get a valid case ID from the library page
    await page.goto('/library/case-studies', { timeout: 10000 })
    const firstCaseLink = page.locator('a[href*="/library/case-studies/"]').first()
    await expect(firstCaseLink).toBeVisible({ timeout: 5000 })
    const href = await firstCaseLink.getAttribute('href')
    if (href) {
      const caseId = href.split('/library/case-studies/')[1]
      if (caseId) {
        await page.goto(`/case-studies/${caseId}`, { timeout: 10000 })
        await expect(page).toHaveURL(new RegExp(`.*/library/case-studies/${caseId}`), { timeout: 10000 })
      }
    }
  })

  test('redirects /case-studies/:caseId/tasks to /library/case-studies/:caseId/tasks', async ({ page }) => {
    // First get a valid case ID from the library page
    await page.goto('/library/case-studies', { timeout: 10000 })
    const firstCaseLink = page.locator('a[href*="/library/case-studies/"]').first()
    await expect(firstCaseLink).toBeVisible({ timeout: 5000 })
    const href = await firstCaseLink.getAttribute('href')
    if (href) {
      const caseId = href.split('/library/case-studies/')[1]
      if (caseId) {
        await page.goto(`/case-studies/${caseId}/tasks`, { timeout: 10000 })
        await expect(page).toHaveURL(new RegExp(`.*/library/case-studies/${caseId}/tasks`), { timeout: 10000 })
      }
    }
  })

  test('redirects /simulations/:slug/brief to /library/case-studies', async ({ page }) => {
    await page.goto('/simulations/test-case/brief', { timeout: 10000 })
    await expect(page).toHaveURL(/.*\/library\/case-studies/, { timeout: 10000 })
  })
})





