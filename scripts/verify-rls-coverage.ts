#!/usr/bin/env tsx
/**
 * Script to verify RLS coverage for all tables
 * Compares Prisma schema models with migration files to ensure all tables have RLS policies
 */

import { prisma } from '../lib/prisma/client'
import fs from 'fs'
import path from 'path'

interface TableInfo {
  name: string
  hasRLS: boolean
  policies: string[]
  migrationFile?: string
}

async function checkRLSStatus(tableName: string): Promise<{ enabled: boolean; policies: any[] }> {
  try {
    // Check if RLS is enabled
    const rlsStatus = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = ${tableName}
    `

    // Get policies
    const policies = await prisma.$queryRaw<Array<{
      schemaname: string
      tablename: string
      policyname: string
      permissive: string
      roles: string[]
      cmd: string
      qual: string
      with_check: string
    }>>`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = ${tableName}
    `

    return {
      enabled: rlsStatus[0]?.rowsecurity || false,
      policies: policies || [],
    }
  } catch (error) {
    console.error(`Error checking RLS for ${tableName}:`, error)
    return { enabled: false, policies: [] }
  }
}

async function scanMigrationsForRLS(): Promise<Map<string, string[]>> {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  
  const tablePolicies = new Map<string, string[]>()
  
  for (const file of migrationFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    
    // Extract CREATE POLICY statements
    const policyMatches = content.matchAll(/CREATE POLICY\s+"([^"]+)"\s+ON\s+public\.(\w+)/gi)
    for (const match of policyMatches) {
      const policyName = match[1]
      const tableName = match[2]
      
      if (!tablePolicies.has(tableName)) {
        tablePolicies.set(tableName, [])
      }
      tablePolicies.get(tableName)!.push(policyName)
    }
    
    // Check for ALTER TABLE ... ENABLE ROW LEVEL SECURITY
    const rlsMatches = content.matchAll(/ALTER TABLE\s+public\.(\w+)\s+ENABLE ROW LEVEL SECURITY/gi)
    for (const match of rlsMatches) {
      const tableName = match[1]
      if (!tablePolicies.has(tableName)) {
        tablePolicies.set(tableName, [])
      }
    }
  }
  
  return tablePolicies
}

async function main() {
  console.log('🔒 Verifying RLS Coverage\n')
  console.log('=' .repeat(60) + '\n')
  
  // Tables that should have RLS (user-facing data tables from Prisma schema)
  const expectedTables = [
    'profiles',
    'competencies',
    'articles',
    'cases',
    'case_competencies',
    'simulations',
    'debriefs',
    'forum_channels',
    'forum_threads',
    'forum_posts',
    'user_lesson_progress',
    'user_article_progress',
    'user_residency',
    'subscriptions',
    'user_applications',
    'notifications',
    'token_usage', // daily aggregated data, may not need RLS
  ]
  
  const migrationPolicies = await scanMigrationsForRLS()
  const results: TableInfo[] = []
  
  for (const tableName of expectedTables) {
    const rlsStatus = await checkRLSStatus(tableName)
    const migrationPoliciesList = migrationPolicies.get(tableName) || []
    
    results.push({
      name: tableName,
      hasRLS: rlsStatus.enabled,
      policies: [
        ...migrationPoliciesList,
        ...rlsStatus.policies.map(p => p.policyname),
      ],
    })
    
    const status = rlsStatus.enabled ? '✅' : '❌'
    const policyCount = rlsStatus.policies.length + migrationPoliciesList.length
    
    console.log(`${status} ${tableName.padEnd(30)} RLS: ${rlsStatus.enabled ? 'ENABLED' : 'DISABLED'.padEnd(8)} Policies: ${policyCount}`)
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  // Summary
  const missingRLS = results.filter(r => !r.hasRLS)
  const missingPolicies = results.filter(r => r.hasRLS && r.policies.length === 0)
  
  if (missingRLS.length > 0) {
    console.log('⚠️  Tables missing RLS:')
    missingRLS.forEach(t => console.log(`   - ${t.name}`))
    console.log()
  }
  
  if (missingPolicies.length > 0) {
    console.log('⚠️  Tables with RLS enabled but no policies:')
    missingPolicies.forEach(t => console.log(`   - ${t.name}`))
    console.log()
  }
  
  if (missingRLS.length === 0 && missingPolicies.length === 0) {
    console.log('✅ All tables have RLS enabled with appropriate policies!\n')
  }
  
  // Detailed policy report
  console.log('\n📋 Policy Summary:\n')
  results.forEach(table => {
    if (table.policies.length > 0) {
      console.log(`${table.name}:`)
      const uniquePolicies = [...new Set(table.policies)]
      uniquePolicies.forEach(policy => console.log(`   - ${policy}`))
      console.log()
    }
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)

