#!/usr/bin/env tsx
/**
 * Create the assets storage bucket if it doesn't exist
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createBucket() {
  console.log('📦 Creating assets storage bucket...\n')
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message)
    process.exit(1)
  }
  
  const bucketExists = buckets?.some(b => b.name === 'assets')
  
  if (bucketExists) {
    console.log('✅ Bucket "assets" already exists')
    return
  }
  
  // Create bucket
  const { data, error } = await supabase.storage.createBucket('assets', {
    public: false,
    allowedMimeTypes: ['text/markdown', 'application/json', 'text/plain', 'text/csv'],
    fileSizeLimit: 5242880, // 5MB
  })
  
  if (error) {
    console.error('❌ Error creating bucket:', error.message)
    console.error('\n💡 You may need to create it manually in Supabase Dashboard:')
    console.error('   1. Go to Storage')
    console.error('   2. Create new bucket named "assets"')
    console.error('   3. Set it to private (not public)')
    process.exit(1)
  }
  
  console.log('✅ Bucket "assets" created successfully!')
}

createBucket().catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})



