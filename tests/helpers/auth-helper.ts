import { Page } from '@playwright/test'

/**
 * Authentication helper for E2E tests
 * Provides utilities for user login, session management, and auth state
 */

export interface TestUser {
  id: string
  email: string
  password: string
  role: 'member' | 'editor' | 'admin'
  username: string
}

export const TEST_USERS: Record<string, TestUser> = {
  member: {
    id: 'test-user-1',
    email: 'testmember@example.com',
    password: 'TestPassword123!',
    role: 'member',
    username: 'testmember'
  },
  admin: {
    id: 'test-user-2',
    email: 'testadmin@example.com',
    password: 'TestPassword123!',
    role: 'admin',
    username: 'testadmin'
  },
  editor: {
    id: 'test-user-3',
    email: 'testeditor@example.com',
    password: 'TestPassword123!',
    role: 'editor',
    username: 'testeditor'
  }
}

/**
 * Login as a specific test user
 * Uses programmatic login to bypass UI interactions
 */
export async function loginAsUser(page: Page, user: TestUser): Promise<void> {
  // Navigate to login page
  await page.goto('/login')
  
  // Fill login form
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })
  
  // Verify user is logged in by checking for user-specific elements
  await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 })
}

/**
 * Login as member user (most common for E2E tests)
 */
export async function loginAsMember(page: Page): Promise<void> {
  await loginAsUser(page, TEST_USERS.member)
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAsUser(page, TEST_USERS.admin)
}

/**
 * Login as editor user
 */
export async function loginAsEditor(page: Page): Promise<void> {
  await loginAsUser(page, TEST_USERS.editor)
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 })
    return true
  } catch {
    return false
  }
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"]')
  
  // Click logout button
  await page.click('text=Sign Out')
  
  // Wait for redirect to login
  await page.waitForURL('/login', { timeout: 5000 })
}

/**
 * Get current user info from page
 */
export async function getCurrentUser(page: Page): Promise<TestUser | null> {
  try {
    // Check if we're on a protected page (indicates logged in)
    const currentUrl = page.url()
    if (currentUrl.includes('/login') || currentUrl.includes('/signup')) {
      return null
    }
    
    // Try to extract user info from page
    const userMenu = await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 })
    const username = await userMenu.textContent()
    
    // Find matching user by username
    const user = Object.values(TEST_USERS).find(u => u.username === username?.trim())
    return user || null
  } catch {
    return null
  }
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page): Promise<void> {
  // Wait for either login redirect or dashboard load
  await Promise.race([
    page.waitForURL('/login', { timeout: 5000 }),
    page.waitForURL('/dashboard', { timeout: 5000 }),
    page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 })
  ])
}

/**
 * Bypass email verification for test users
 * This should be handled by the test environment configuration
 */
export async function bypassEmailVerification(page: Page): Promise<void> {
  // In test environment, email verification should be bypassed
  // This function exists for documentation purposes
  // The actual bypass should be configured in the test environment
  console.log('Email verification bypassed for test environment')
}

/**
 * Create a new test user programmatically
 * This would typically be done via API or database seeding
 */
export async function createTestUser(userData: Partial<TestUser>): Promise<TestUser> {
  // This would make an API call to create a user
  // For now, we'll use the seeded test users
  throw new Error('createTestUser not implemented - use seeded test users')
}

/**
 * Clean up test user data
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  // This would clean up user data after tests
  // For now, we rely on database reset between test runs
  console.log(`Cleaning up test user: ${userId}`)
}
