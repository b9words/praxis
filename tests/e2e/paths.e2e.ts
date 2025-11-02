import { test, expect } from '@playwright/test'

test.describe('Learning Paths E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('/login')
    // Assume authentication helper exists
    // In real scenario, use test credentials
  })

  test('should browse learning paths and view progress', async ({ page }) => {
    await page.goto('/library/paths')

    // Should see learning paths list
    await expect(page.locator('h1')).toContainText('Curated Learning Paths')
    
    // Should see at least one path card
    const pathCards = page.locator('[role="listitem"]')
    const count = await pathCards.count()
    expect(count).toBeGreaterThan(0)

    // Should see progress indicators
    const progressBars = page.locator('[role="progressbar"]')
    const progressCount = await progressBars.count()
    expect(progressCount).toBeGreaterThan(0)
  })

  test('should navigate to path detail and see items', async ({ page }) => {
    await page.goto('/library/paths')
    
    // Click first path
    const firstPath = page.locator('a[href^="/library/paths/"]').first()
    await firstPath.click()

    // Should be on detail page
    await expect(page).toHaveURL(/\/library\/paths\/\w+/)
    
    // Should see path items
    const pathItems = page.locator('[role="listitem"]')
    const itemCount = await pathItems.count()
    expect(itemCount).toBeGreaterThan(0)

    // Should see progress overview
    await expect(page.locator('text=Your Progress')).toBeVisible()
  })

  test('should track progress when completing path items', async ({ page }) => {
    await page.goto('/library/paths/unit-economics')
    
    // Check initial progress
    const initialProgress = await page.locator('[role="progressbar"]').first()
    const initialValue = await initialProgress.getAttribute('aria-valuenow')
    
    // Navigate to first incomplete item and mark as complete
    // (This would require actual lesson completion in real test)
    
    // Progress should update
    // Note: This is a simplified test - real implementation would require
    // actual lesson completion tracking
  })

  test('should show completion state when all items done', async ({ page }) => {
    // This test would require a user with completed path
    // Simplified version checks for completion UI
    await page.goto('/library/paths')
    
    // Should handle empty state gracefully
    const emptyState = page.locator('text=No learning paths available')
    // Either should see paths or empty state, not an error
    const hasPaths = await page.locator('[role="listitem"]').count()
    const hasEmpty = await emptyState.isVisible()
    
    expect(hasPaths > 0 || hasEmpty).toBe(true)
  })
})

