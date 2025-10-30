import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Database helper for E2E tests
 * Provides utilities for database setup, teardown, and data management
 */

export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl: boolean
}

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Parse DATABASE_URL for Supabase connection
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) {
    const url = new URL(databaseUrl)
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
      ssl: true
    }
  }
  
  // Fallback to environment variables
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'praxis_test',
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    ssl: process.env.DATABASE_SSL === 'true'
  }
}

/**
 * Reset database to clean state
 * Drops and recreates all tables, then runs migrations
 */
export async function resetDatabase(): Promise<void> {
  console.log('Resetting database...')
  
  try {
    // Run Prisma reset (drops database, recreates, runs migrations)
    await execAsync('npx prisma db push --force-reset', {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: getDatabaseUrl() }
    })
    
    console.log('Database reset completed')
  } catch (error) {
    console.error('Failed to reset database:', error)
    throw error
  }
}

/**
 * Seed database with test data
 */
export async function seedDatabase(): Promise<void> {
  console.log('Seeding database with test data...')
  
  try {
    // Run the seed SQL file using psql with proper connection string
    const command = `psql "${getDatabaseUrl()}" -f tests/seed-data.sql`
    
    await execAsync(command, {
      cwd: process.cwd()
    })
    
    console.log('Database seeded successfully')
  } catch (error) {
    console.error('Failed to seed database:', error)
    throw error
  }
}

/**
 * Reset and seed database in one operation
 */
export async function resetAndSeedDatabase(): Promise<void> {
  await resetDatabase()
  await seedDatabase()
}

/**
 * Get database URL for Prisma
 */
export function getDatabaseUrl(): string {
  // Use the original DATABASE_URL if available
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  
  // Fallback to constructing from config
  const config = getDatabaseConfig()
  const sslParam = config.ssl ? '?sslmode=require' : ''
  return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${sslParam}`
}

/**
 * Check if database is accessible
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const command = `psql "${getDatabaseUrl()}" -c "SELECT 1"`
    
    await execAsync(command, {
      cwd: process.cwd()
    })
    
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

/**
 * Run a custom SQL query
 */
export async function runQuery(query: string): Promise<any> {
  try {
    const command = `psql "${getDatabaseUrl()}" -c "${query}"`
    
    const { stdout } = await execAsync(command, {
      cwd: process.cwd()
    })
    
    return stdout
  } catch (error) {
    console.error('Query failed:', error)
    throw error
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<any> {
  const query = `SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = '${email}')`
  return await runQuery(query)
}

/**
 * Get simulation by ID
 */
export async function getSimulationById(simulationId: string): Promise<any> {
  const query = `SELECT * FROM simulations WHERE id = '${simulationId}'`
  return await runQuery(query)
}

/**
 * Get case by ID
 */
export async function getCaseById(caseId: string): Promise<any> {
  const query = `SELECT * FROM cases WHERE id = '${caseId}'`
  return await runQuery(query)
}

/**
 * Get forum thread by ID
 */
export async function getForumThreadById(threadId: string): Promise<any> {
  const query = `SELECT * FROM forum_threads WHERE id = '${threadId}'`
  return await runQuery(query)
}

/**
 * Clean up test data
 */
export async function cleanupTestData(): Promise<void> {
  console.log('Cleaning up test data...')
  
  try {
    // Delete test users and related data
    const queries = [
      "DELETE FROM notifications WHERE user_id LIKE 'test-user-%'",
      "DELETE FROM user_applications WHERE user_id LIKE 'test-user-%'",
      "DELETE FROM subscriptions WHERE user_id LIKE 'test-user-%'",
      "DELETE FROM user_residency WHERE user_id LIKE 'test-user-%'",
      "DELETE FROM user_lesson_progress WHERE user_id LIKE 'test-user-%'",
      "DELETE FROM user_article_progress WHERE user_id LIKE 'test-user-%'",
      "DELETE FROM debriefs WHERE simulation_id IN (SELECT id FROM simulations WHERE user_id LIKE 'test-user-%')",
      "DELETE FROM simulations WHERE user_id LIKE 'test-user-%'",
      "DELETE FROM forum_posts WHERE author_id LIKE 'test-user-%'",
      "DELETE FROM forum_threads WHERE author_id LIKE 'test-user-%'",
      "DELETE FROM profiles WHERE id LIKE 'test-user-%'"
    ]
    
    for (const query of queries) {
      await runQuery(query)
    }
    
    console.log('Test data cleaned up')
  } catch (error) {
    console.error('Failed to cleanup test data:', error)
    throw error
  }
}

/**
 * Wait for database to be ready
 */
export async function waitForDatabase(maxRetries = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    if (await checkDatabaseConnection()) {
      return
    }
    
    console.log(`Waiting for database... (${i + 1}/${maxRetries})`)
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  
  throw new Error('Database not ready after maximum retries')
}

/**
 * Setup test database (reset, seed, verify)
 */
export async function setupTestDatabase(): Promise<void> {
  console.log('Setting up test database...')
  
  // Wait for database to be ready
  await waitForDatabase()
  
  // Reset and seed
  await resetAndSeedDatabase()
  
  // Verify setup
  const userCount = await runQuery("SELECT COUNT(*) FROM profiles WHERE id LIKE 'test-user-%'")
  console.log(`Test database setup complete. Found ${userCount} test users.`)
}
