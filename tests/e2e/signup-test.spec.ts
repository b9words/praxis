import { expect, test } from '@playwright/test'

test.describe('Signup Test', () => {
  test('signup page loads', async ({ page }) => {
    await page.goto('/signup')
    console.log('Signup page URL:', page.url())
    console.log('Page title:', await page.title())
    
    // Check if we're on the signup page
    await expect(page.locator('text=Sign Up')).toBeVisible()
    
    // Check for form fields
    const usernameField = page.locator('input[id="username"]')
    const emailField = page.locator('input[type="email"]')
    const passwordField = page.locator('input[type="password"]')
    
    console.log('Username field visible:', await usernameField.isVisible())
    console.log('Email field visible:', await emailField.isVisible())
    console.log('Password field visible:', await passwordField.isVisible())
  })
})
