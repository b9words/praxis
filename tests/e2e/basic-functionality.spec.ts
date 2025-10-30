import { expect, test } from '@playwright/test'

/**
 * Basic functionality tests
 * Tests core pages load and basic interactions work
 */
test.describe('Basic Functionality', () => {
  test('homepage loads and navigation works', async ({ page }) => {
    // Test homepage
    await page.goto('/')
    await expect(page).toHaveTitle(/Praxis/)
    await expect(page.getByRole('heading', { name: 'The Proving Ground for' })).toBeVisible()

    // Test navigation links
    const curriculumLink = page.locator('a[href="/library/curriculum"]')
    await expect(curriculumLink).toBeVisible()
    
    const simulationsLink = page.locator('a[href="/simulations"]')
    await expect(simulationsLink).toBeVisible()
    
    const communityLink = page.locator('a[href="/community"]')
    await expect(communityLink).toBeVisible()
  })

  test('signup page loads and form works', async ({ page }) => {
    await page.goto('/signup')
    
    // Check page elements
    await expect(page.locator('text=Request Access')).toBeVisible()
    await expect(page.locator('text=Create your account')).toBeVisible()
    
    // Check form fields
    const usernameField = page.locator('input[id="username"]')
    const emailField = page.locator('input[type="email"]')
    const passwordField = page.locator('input[type="password"]')
    
    await expect(usernameField).toBeVisible()
    await expect(emailField).toBeVisible()
    await expect(passwordField).toBeVisible()
    
    // Test form interaction
    await usernameField.fill('testuser123')
    await emailField.fill('test@example.com')
    await passwordField.fill('password123')
    
    // Check submit button
    const submitButton = page.locator('button:has-text("Sign Up")')
    await expect(submitButton).toBeVisible()
  })

  test('login page loads and form works', async ({ page }) => {
    await page.goto('/login')
    
    // Check page elements
    await expect(page.locator('text=Access the Proving Ground')).toBeVisible()
    await expect(page.locator('text=Authenticate to access')).toBeVisible()
    
    // Check form fields
    const emailField = page.locator('input[type="email"]')
    const passwordField = page.locator('input[type="password"]')
    
    await expect(emailField).toBeVisible()
    await expect(passwordField).toBeVisible()
    
    // Test form interaction
    await emailField.fill('test@example.com')
    await passwordField.fill('password123')
    
    // Check submit button
    const submitButton = page.locator('button:has-text("Authenticate")')
    await expect(submitButton).toBeVisible()
  })

  test('dev tools are visible in development', async ({ page }) => {
    await page.goto('/')
    
    // Check if dev tools are visible
    const devTools = page.locator('text=🛠️ Dev Tools')
    await expect(devTools).toBeVisible()
    
    // Check quick login buttons
    const adminButton = page.locator('button:has-text("👑 Admin")')
    const editorButton = page.locator('button:has-text("✏️ Editor")')
    const userButton = page.locator('button:has-text("👤 User")')
    
    await expect(adminButton).toBeVisible()
    await expect(editorButton).toBeVisible()
    await expect(userButton).toBeVisible()
  })

  test('protected pages redirect to login', async ({ page }) => {
    // Test dashboard redirect
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
    
    // Test library redirect
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login/)
    
    // Test simulations redirect
    await page.goto('/simulations')
    await expect(page).toHaveURL(/\/login/)
    
    // Test community redirect
    await page.goto('/community')
    await expect(page).toHaveURL(/\/login/)
  })
})
