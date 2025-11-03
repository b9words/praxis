#!/usr/bin/env tsx

/**
 * Publish content from draft to published status
 * 
 * Usage:
 *   tsx scripts/publish-content.ts --type article --path articles/year1/domain/module/lesson.md
 *   tsx scripts/publish-content.ts --type case --path cases/year1/domain/module/lesson.json
 *   tsx scripts/publish-content.ts --type article --id <article-id>
 *   tsx scripts/publish-content.ts --type case --id <case-id>
 */

import path from 'path'
import { supabase } from './generate-shared'

interface PublishOptions {
  type: 'article' | 'case'
  path?: string
  id?: string
}

/**
 * Verify file exists in storage
 */
async function verifyFileInStorage(storagePath: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  const { data, error } = await supabase.storage
    .from('assets')
    .list(path.dirname(storagePath), {
      search: path.basename(storagePath),
    })
  
  return !error && data !== null && data.length > 0
}

/**
 * Publish content by storage path
 */
async function publishByPath(type: 'article' | 'case', storagePath: string) {
  console.log(`📝 Publishing ${type}...`)
  console.log(`   Path: ${storagePath}\n`)
  
  // Verify file exists in storage
  console.log('🔍 Verifying file in storage...')
  const exists = await verifyFileInStorage(storagePath)
  if (!exists) {
    throw new Error(`File not found in storage: ${storagePath}`)
  }
  console.log('✅ File verified\n')
  
  // Find record in database
  const tableName = type === 'article' ? 'articles' : 'cases'
  console.log(`🔍 Finding ${type} in database...`)
  
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  
  const { data: record, error: findError } = await supabase
    .from(tableName)
    .select('id, title, status')
    .eq('storage_path', storagePath)
    .maybeSingle()
  
  if (findError) {
    throw new Error(`Database query failed: ${findError.message}`)
  }
  
  if (!record) {
    throw new Error(`${type} not found in database. Run /api/storage/sync or the generation script first.`)
  }
  
  console.log(`   Found: ${record.title}`)
  console.log(`   Current status: ${record.status}\n`)
  
  if (record.status === 'published') {
    console.log('✅ Content is already published!')
    return
  }
  
  // Update status to published
  console.log('🔄 Updating status to published...')
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ status: 'published' })
    .eq('id', record.id)
  
  if (updateError) {
    throw new Error(`Failed to update status: ${updateError.message}`)
  }
  
  console.log('✅ Published successfully!\n')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3400'
  console.log('📝 View in platform:')
  console.log(`   Content: ${baseUrl}/admin/content`)
  if (type === 'article') {
    console.log(`   Article: ${baseUrl}/library/curriculum/...`)
  } else {
    console.log(`   Case: ${baseUrl}/simulation/...`)
  }
}

/**
 * Publish content by database ID
 */
async function publishById(type: 'article' | 'case', id: string) {
  console.log(`📝 Publishing ${type}...`)
  console.log(`   ID: ${id}\n`)
  
  const tableName = type === 'article' ? 'articles' : 'cases'
  
  // Find record
  console.log(`🔍 Finding ${type} in database...`)
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  const { data: record, error: findError } = await supabase
    .from(tableName)
    .select('id, title, status, storage_path')
    .eq('id', id)
    .maybeSingle()
  
  if (findError) {
    throw new Error(`Database query failed: ${findError.message}`)
  }
  
  if (!record) {
    throw new Error(`${type} not found with ID: ${id}`)
  }
  
  console.log(`   Found: ${record.title}`)
  console.log(`   Current status: ${record.status}`)
  console.log(`   Storage path: ${record.storage_path || 'N/A'}\n`)
  
  if (record.status === 'published') {
    console.log('✅ Content is already published!')
    return
  }
  
  // Verify file exists if storage_path is available
  if (record.storage_path) {
    console.log('🔍 Verifying file in storage...')
    const exists = await verifyFileInStorage(record.storage_path)
    if (!exists) {
      console.warn('⚠️  Warning: File not found in storage, but proceeding with publish...')
    } else {
      console.log('✅ File verified\n')
    }
  }
  
  // Update status to published
  console.log('🔄 Updating status to published...')
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ status: 'published' })
    .eq('id', record.id)
  
  if (updateError) {
    throw new Error(`Failed to update status: ${updateError.message}`)
  }
  
  console.log('✅ Published successfully!\n')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3400'
  console.log('📝 View in platform:')
  console.log(`   Content: ${baseUrl}/admin/content`)
}

/**
 * Main publish function
 */
async function publishContent(options: PublishOptions) {
  const { type, path: storagePath, id } = options
  
  if (!type || (!storagePath && !id)) {
    throw new Error('Must provide --type and either --path or --id')
  }
  
  if (type !== 'article' && type !== 'case') {
    throw new Error('Type must be "article" or "case"')
  }
  
  console.log('🚀 Content Publishing Script\n')
  console.log('===========================\n')
  
  if (storagePath) {
    await publishByPath(type, storagePath)
  } else if (id) {
    await publishById(type, id)
  }
}

// CLI parsing
const args = process.argv.slice(2)
const options: PublishOptions = {} as PublishOptions

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type' && args[i + 1]) {
    options.type = args[i + 1] as 'article' | 'case'
    i++
  } else if (args[i] === '--path' && args[i + 1]) {
    options.path = args[i + 1]
    i++
  } else if (args[i] === '--id' && args[i + 1]) {
    options.id = args[i + 1]
    i++
  }
}

// Run
publishContent(options).catch(error => {
  console.error('\n❌ Error:', error.message || error)
  process.exit(1)
})

