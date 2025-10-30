import { expect, test } from '@playwright/test'

test.describe('Login Flow Test', () => {
  test('login page loads and form works', async ({ page }) => {
    await page.goto('/login')
    
    console.log('Login page URL:', page.url())
    console.log('Page title:', await page.title())
    
    // Check if we're on the login page
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible()
    
    // Check for form fields
    const emailField = page.locator('input[type="email"]')
    const passwordField = page.locator('input[type="password"]')
    
    console.log('Email field visible:', await emailField.isVisible())
    console.log('Password field visible:', await passwordField.isVisible())
    
    // Try to fill the form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    console.log('Form filled successfully')
    
    // Check if submit button is present
    const submitButton = page.locator('button[type="submit"]')
    console.log('Submit button visible:', await submitButton.isVisible())
  })
})
