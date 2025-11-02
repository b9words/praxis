import { expect, test } from '@playwright/test'

test.describe('Simple Test', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Execemy/)
    console.log('Page title:', await page.title())
    console.log('Page URL:', page.url())
  })
})
