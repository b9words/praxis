#!/usr/bin/env node
/**
 * Script to run prisma db push with .env.local loaded
 * This ensures DATABASE_URL is available for Prisma CLI
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

// Run prisma migrate dev instead of db push
// This avoids introspection issues with cross-schema foreign keys (auth.users)
try {
  console.log('Running prisma migrate dev (recommended over db push)...\n')
  console.log('Note: This will create a migration file if schema has changed.\n')
  
  // Find prisma CLI path - use the direct require.resolve result
  const prismaCliPath = require.resolve('prisma')
  
  // Use migrate dev which doesn't introspect - just applies schema changes
  // If no changes, it will just generate the client
  execSync(`node "${prismaCliPath}" migrate dev --name schema_update`, {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
    shell: true,
  })
  console.log('\n✅ Database migration completed successfully!')
} catch (error) {
  console.error('\n❌ Database migration failed')
  console.error('\n💡 Alternative: If you need to use db push, you can manually run:')
  console.error('   npx prisma db push --skip-generate --accept-data-loss')
  console.error('\n   But migrations (prisma migrate dev) are recommended.')
  process.exit(1)
}

