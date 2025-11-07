/**
 * Database Trigger Handler
 * 
 * This edge function handles database webhooks from Supabase
 * and triggers automated emails based on configured events.
 * 
 * Supported events:
 * - user_signed_up: Triggered when a new user signs up
 * - domain_completed: Triggered when a user completes a domain
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

/**
 * Generate simple HTML email content
 */
function generateEmailHTML(subject: string, message: string, userName?: string): string {
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://execemy.com'
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">${subject}</h1>
    ${userName ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Hello, ${userName}!</p>` : ''}
  </div>
  <div style="background: #f9fafb; padding: 30px;">
    <div style="background: white; padding: 25px; border-radius: 8px;">
      <div style="color: #374151; font-size: 16px; line-height: 24px;">
        ${message}
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Send email via Resend
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@execemy.com'

  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend API error:', errorText)
      return { success: false, error: `Resend API error: ${response.status}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle new user signup
 */
async function handleNewUser(
  supabase: any,
  userRecord: { id: string; email?: string; created_at?: string }
): Promise<void> {
  // Get user email - try from record first, then from auth API
  let userEmail: string | undefined = userRecord.email

  if (!userEmail) {
    // Get user email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userRecord.id)
    if (authError || !authUser?.user?.email) {
      console.error('Error fetching user email:', authError)
      return
    }
    userEmail = authUser.user.email
  }

  if (!userEmail) {
    console.log('User record has no email, skipping')
    return
  }

  // Query automated emails for user_signed_up event with delayDays=0
  const { data: emails, error: emailsError } = await supabase
    .from('automated_emails')
    .select('*')
    .eq('eventName', 'user_signed_up')
    .eq('isActive', true)
    .eq('delayDays', 0)

  if (emailsError) {
    console.error('Error fetching automated emails:', emailsError)
    return
  }

  if (!emails || emails.length === 0) {
    console.log('No active automated emails found for user_signed_up event')
    return
  }

  // Get user profile for name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', userRecord.id)
    .single()

  const userName = profile?.full_name || profile?.username || undefined

  // Send each email
  for (const emailConfig of emails) {
    const subject = emailConfig.subject
    let message = ''

    // Generate message based on template
    switch (emailConfig.template) {
      case 'welcome':
        message = 'Welcome to Execemy! Your account is active and ready to use. Get started by exploring the Intelligence Library or deploying to your first scenario.'
        break
      case 'general':
        message = 'Thank you for joining Execemy! We\'re excited to have you on board.'
        break
      default:
        message = 'Thank you for joining Execemy!'
    }

    const html = generateEmailHTML(subject, message, userName)
    const result = await sendEmail(userEmail, subject, html)

    if (result.success) {
      console.log(`Welcome email sent to ${userEmail}`)
    } else {
      console.error(`Failed to send welcome email to ${userEmail}:`, result.error)
    }
  }
}

/**
 * Handle domain completion
 */
async function handleDomainCompletion(
  supabase: any,
  completionRecord: { user_id: string; domain_id: string }
): Promise<void> {
  // Get user email
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(completionRecord.user_id)
  if (authError || !authUser?.user?.email) {
    console.error('Error fetching user email:', authError)
    return
  }

  const userEmail = authUser.user.email

  // Query automated emails for domain_completed event
  // Get all active emails (multiple drips allowed per event)
  const { data: emailConfigs, error: emailsError } = await supabase
    .from('automated_emails')
    .select('*')
    .eq('eventName', 'domain_completed')
    .eq('isActive', true)
    .order('delayDays', { ascending: true })

  if (emailsError) {
    console.error('Error fetching automated emails:', emailsError)
    return
  }

  if (!emailConfigs || emailConfigs.length === 0) {
    console.log('No active automated email found for domain_completed event')
    return
  }

  // Use the first email config (typically delayDays=0 for immediate send)
  // For domain completions, we typically only want immediate sends
  const emailConfig = emailConfigs.find(e => e.delayDays === 0) || emailConfigs[0]

  // Get user profile for name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', completionRecord.user_id)
    .single()

  const userName = profile?.full_name || profile?.username || undefined

  // Generate subject with domain name substitution
  let subject = emailConfig.subject.replace('[Domain Name]', completionRecord.domain_id)

  // Generate message
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://execemy.com'
  const certificateUrl = `${appUrl}/certificates/${completionRecord.domain_id}`
  const message = `Congratulations! You've completed the ${completionRecord.domain_id} domain. View your certificate and continue your learning journey.`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">${subject}</h1>
    ${userName ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Great work, ${userName}!</p>` : ''}
  </div>
  <div style="background: #f9fafb; padding: 30px;">
    <div style="background: white; padding: 25px; border-radius: 8px;">
      <div style="color: #374151; font-size: 16px; line-height: 24px;">
        ${message}
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${certificateUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Certificate</a>
      </div>
      <div style="text-align: center; margin-top: 15px;">
        <a href="${appUrl}/dashboard" style="color: #667eea; text-decoration: none;">Go to Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  const result = await sendEmail(userEmail, subject, html)

  if (result.success) {
    console.log(`Domain completion email sent to ${userEmail} for domain ${completionRecord.domain_id}`)
  } else {
    console.error(`Failed to send domain completion email to ${userEmail}:`, result.error)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization (from webhook)
    // Use dedicated webhook secret instead of service role key for better security
    const authHeader = req.headers.get('authorization')
    const webhookSecret = Deno.env.get('EDGE_WEBHOOK_SECRET')
    
    if (!webhookSecret) {
      console.error('EDGE_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Exact match check - no includes() logic
    const expectedAuth = `Bearer ${webhookSecret}`
    if (!authHeader || authHeader !== expectedAuth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse webhook payload
    // Prefer standard Supabase webhook format, but handle alternatives gracefully
    let payload: WebhookPayload
    try {
      const body = await req.json()
      
      // Standard Supabase webhook format (preferred)
      if (body.type && body.table && body.record) {
        payload = body
      } else if (body.eventType && body.table && body.new) {
        // Alternative format (some webhook configurations)
        payload = {
          type: body.eventType === 'INSERT' ? 'INSERT' : body.eventType === 'UPDATE' ? 'UPDATE' : 'DELETE',
          table: body.table,
          record: body.new || body.record,
          old_record: body.old,
        }
      } else if (body.record) {
        // Direct record format (auth.users webhook might send this)
        payload = {
          type: 'INSERT',
          table: 'users',
          record: body.record || body,
        }
      } else {
        // Fallback: treat entire body as record for auth.users
        // Log unknown format for debugging
        console.warn('Unknown webhook payload format, attempting fallback:', Object.keys(body))
        payload = {
          type: 'INSERT',
          table: 'users',
          record: body,
        }
      }
    } catch (error) {
      console.error('Error parsing webhook payload:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid payload format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { type, table, record } = payload
    console.log(`Received webhook: ${type} on ${table}`, { recordId: record?.id, recordEmail: record?.email })

    // Handle auth.users INSERT (user signup)
    // Note: Supabase webhooks on auth.users might not work directly
    // This handles both webhook format and direct calls from triggers
    if ((table === 'users' || table === 'auth.users') && type === 'INSERT') {
      await handleNewUser(supabaseAdmin, record)
      return new Response(
        JSON.stringify({ success: true, message: 'User signup processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle domain_completions INSERT
    if (table === 'domain_completions' && type === 'INSERT') {
      await handleDomainCompletion(supabaseAdmin, record)
      return new Response(
        JSON.stringify({ success: true, message: 'Domain completion processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Unknown event
    console.log(`Unknown webhook event: ${type} on ${table}`)
    return new Response(
      JSON.stringify({ success: true, message: 'Event not handled' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in handle-db-trigger function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

