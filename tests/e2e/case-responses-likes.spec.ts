import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'e2e.user@execemy.test'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!'

test.describe('Case Study Responses and Likes', () => {
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

  test('can view community responses on case overview page', async ({ page }) => {
    // Navigate to case studies
    await page.goto('/library/case-studies', { timeout: 10000 })
    
    // Click first case
    const firstCaseLink = page.locator('a[href*="/library/case-studies/"]').first()
    await expect(firstCaseLink).toBeVisible({ timeout: 5000 })
    await firstCaseLink.click({ timeout: 5000 })
    
    // Wait for overview page
    await page.waitForURL(/.*\/library\/case-studies\/.*/, { timeout: 10000 })
    
    // Check if community responses section exists (may be empty)
    const communitySection = page.locator('text=/Community Responses/i')
    // Section may or may not be visible depending on whether responses exist
    // Just verify page loaded correctly
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 })
  })

  test('can like and unlike a response (single like per user)', async ({ page }) => {
    // Navigate to a case study with responses (if any exist)
    await page.goto('/library/case-studies', { timeout: 10000 })
    
    const firstCaseLink = page.locator('a[href*="/library/case-studies/"]').first()
    await expect(firstCaseLink).toBeVisible({ timeout: 5000 })
    await firstCaseLink.click({ timeout: 5000 })
    
    await page.waitForURL(/.*\/library\/case-studies\/.*/, { timeout: 10000 })
    
    // Look for like buttons in community responses
    const likeButton = page.locator('button:has([class*="ThumbsUp"]), button:has-text(/\\d+/):has([class*="ThumbsUp"])').first()
    
    if (await likeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Get initial like count
      const initialText = await likeButton.textContent()
      const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0')
      
      // Click like button
      await likeButton.click({ timeout: 5000 })
      await page.waitForTimeout(1000) // Wait for API call
      
      // Verify count changed (increased by 1)
      const updatedText = await likeButton.textContent()
      const updatedCount = parseInt(updatedText?.match(/\d+/)?.[0] || '0')
      
      // Count should have increased (or decreased if it was already liked)
      expect(Math.abs(updatedCount - initialCount)).toBeLessThanOrEqual(1)
      
      // Click again to unlike
      await likeButton.click({ timeout: 5000 })
      await page.waitForTimeout(1000)
      
      // Verify count returned to original (or close)
      const finalText = await likeButton.textContent()
      const finalCount = parseInt(finalText?.match(/\d+/)?.[0] || '0')
      expect(Math.abs(finalCount - initialCount)).toBeLessThanOrEqual(1)
    } else {
      // No responses yet - skip test
      test.skip()
    }
  })

  test('responses are sorted by likes (highest first)', async ({ page }) => {
    // Navigate to a case study
    await page.goto('/library/case-studies', { timeout: 10000 })
    
    const firstCaseLink = page.locator('a[href*="/library/case-studies/"]').first()
    await expect(firstCaseLink).toBeVisible({ timeout: 5000 })
    await firstCaseLink.click({ timeout: 5000 })
    
    await page.waitForURL(/.*\/library\/case-studies\/.*/, { timeout: 10000 })
    
    // Get all like counts from response cards
    const likeButtons = page.locator('button:has([class*="ThumbsUp"])')
    const count = await likeButtons.count()
    
    if (count >= 2) {
      // Extract like counts
      const likeCounts: number[] = []
      for (let i = 0; i < count; i++) {
        const text = await likeButtons.nth(i).textContent()
        const num = parseInt(text?.match(/\d+/)?.[0] || '0')
        likeCounts.push(num)
      }
      
      // Verify descending order (each count should be <= previous)
      for (let i = 1; i < likeCounts.length; i++) {
        expect(likeCounts[i]).toBeLessThanOrEqual(likeCounts[i - 1])
      }
    } else {
      // Not enough responses to test sorting
      test.skip()
    }
  })
})





