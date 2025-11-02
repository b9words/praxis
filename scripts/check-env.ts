#!/usr/bin/env tsx
/**
 * Quick diagnostic script to check environment variables
 * Run this before deploying to production to ensure all required variables are set
 */

import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local' })

const check = (key: string, required: boolean = true) => {
  const value = process.env[key]
  const status = value ? `✅ Set${value.length > 10 ? ' (' + value.substring(0, 10) + '...)' : ''}` : (required ? '❌ Not set (REQUIRED)' : '⚠️  Not set (optional)')
  return `  ${key}: ${status}`
}

console.log('📋 Environment Check\n')

console.log('Core Application:')
console.log(check('NEXT_PUBLIC_APP_URL'))
console.log(check('NODE_ENV'))

console.log('\nSupabase:')
console.log(check('NEXT_PUBLIC_SUPABASE_URL'))
console.log(check('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
console.log(check('SUPABASE_SERVICE_ROLE_KEY'))

console.log('\nSentry (Error Monitoring):')
console.log(check('NEXT_PUBLIC_SENTRY_DSN'))
console.log(check('SENTRY_DSN', false))
console.log(check('SENTRY_AUTH_TOKEN'))
console.log(check('SENTRY_ORG'))
console.log(check('SENTRY_PROJECT'))

console.log('\nPostHog (Analytics):')
console.log(check('NEXT_PUBLIC_POSTHOG_KEY'))
console.log(check('POSTHOG_API_KEY'))
console.log(check('NEXT_PUBLIC_POSTHOG_HOST', false))

console.log('\nEmail (Resend):')
console.log(check('RESEND_API_KEY'))
console.log(check('RESEND_FROM_EMAIL'))

console.log('\nAI Services:')
console.log(check('GEMINI_API_KEY'))
console.log(check('OPENAI_API_KEY', false))

console.log('\nOther:')
console.log(check('PADDLE_PUBLIC_KEY', false))
console.log(check('CRON_SECRET', false))

console.log('\n✅ Environment check complete!')

