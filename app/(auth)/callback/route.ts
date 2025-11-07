import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // All redirects removed - handle auth callback without redirects
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // Welcome email is now handled by automated email system via webhook
    // The webhook will trigger on user creation in auth.users (if supported) or domain_completions
    // No need to send welcome email here
    
    if (error) {
      console.error('Error exchanging code for session:', error)
    }
  }

  return NextResponse.json({ success: true })
}


