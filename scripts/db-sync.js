#!/usr/bin/env node
/**
 * Database sync script that works around Prisma introspection issues
 * Uses direct SQL to apply schema changes when needed
 */
const { config } = require('dotenv')
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// Load .env.local file
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  config({ path: envPath })
  console.log('✅ Loaded environment from .env.local')
} else {
  console.warn('⚠️  .env.local not found, using system environment variables')
}

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Please ensure .env.local exists and contains DATABASE_URL.')
  process.exit(1)
}

try {
  console.log('📦 Generating Prisma client...\n')
  
  // Just generate the client - don't try to push or migrate
  // Schema changes should be done via Supabase migrations
  const prismaCliPath = require.resolve('prisma')
  
  execSync(`node "${prismaCliPath}" generate`, {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
    shell: true,
  })
  
  console.log('\n✅ Prisma client generated successfully!')
  console.log('\n💡 Note: For schema changes, use Supabase migrations:')
  console.log('   - Create SQL files in supabase/migrations/')
  console.log('   - Apply with: psql $DATABASE_URL -f path/to/migration.sql')
  console.log('   - Or use: supabase db reset')
  
} catch (error) {
  console.error('\n❌ Failed to generate Prisma client')
  process.exit(1)
}






