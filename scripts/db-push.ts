#!/usr/bin/env tsx
/**
 * Script to run prisma db push with .env.local loaded
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { execSync } from 'child_process'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

// Run prisma db push
try {
  console.log('Loading environment from .env.local...')
  console.log('Running prisma db push...\n')
  execSync('npx prisma db push', {
    stdio: 'inherit',
    env: process.env,
  })
  console.log('\n✅ Database push completed successfully!')
} catch (error) {
  console.error('\n❌ Database push failed:', error)
  process.exit(1)
}


