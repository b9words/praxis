#!/usr/bin/env tsx
/**
 * Quick diagnostic script to check environment variables
 */

import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local' })

console.log('📋 Environment Check\n')
console.log('API Keys:')
console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set (' + process.env.GEMINI_API_KEY.substring(0, 10) + '...)' : '❌ Not set'}`)
console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set (' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : '❌ Not set'}`)
console.log('\nSupabase:')
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}`)
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set'}`)

