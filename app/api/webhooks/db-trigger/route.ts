import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma/server'
import { getActiveAutomatedEmailsForEvent } from '@/lib/db/automatedEmails'
import {
  sendWelcomeEmail,
  sendGeneralNotificationEmail,
} from '@/lib/email'

export const runtime = 'nodejs'

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

/**
 * Handle new user signup
 */
async function handleNewUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  userRecord: { id: string; email?: string; created_at?: string }
): Promise<void> {
  // Get user email - try from record first, then from auth API
  let userEmail: string | undefined = userRecord.email

  if (!userEmail) {
    // Get user email from auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userRecord.id)
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
  const emails = await getActiveAutomatedEmailsForEvent('user_signed_up')
  const immediateEmails = emails.filter((email) => email.delayDays === 0)

  if (immediateEmails.length === 0) {
    console.log('No active automated emails found for user_signed_up event (delayDays=0)')
    return
  }

  // Get user profile for name
  const profile = await prisma.profile.findUnique({
    where: { id: userRecord.id },
    select: {
      fullName: true,
      username: true,
    },
  })

  const userName = profile?.fullName || profile?.username || undefined

  // Send each email using existing email utilities
  for (const emailConfig of immediateEmails) {
    try {
      let sendResult

      switch (emailConfig.template) {
        case 'welcome':
          sendResult = await sendWelcomeEmail(userEmail, userName)
          break

        case 'general':
          sendResult = await sendGeneralNotificationEmail(userEmail, {
            title: emailConfig.subject,
            message: emailConfig.subject, // Use subject as message for general template
            userName,
          })
          break

        default:
          console.warn(`Unsupported template for welcome email: ${emailConfig.template}`)
          continue
      }

      if (sendResult.success) {
        console.log(`Welcome email sent to ${userEmail} (template: ${emailConfig.template})`)
      } else {
        console.error(`Failed to send welcome email to ${userEmail}:`, sendResult.error)
      }
    } catch (error) {
      console.error(`Error sending welcome email to ${userEmail}:`, error)
    }
  }
}

/**
 * Handle domain completion
 */
async function handleDomainCompletion(
  supabaseAdmin: ReturnType<typeof createClient>,
  completionRecord: { user_id: string; domain_id: string }
): Promise<void> {
  // Get user email
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(completionRecord.user_id)
  if (authError || !authUser?.user?.email) {
    console.error('Error fetching user email:', authError)
    return
  }

  const userEmail = authUser.user.email

  // Query automated emails for domain_completed event
  const emailConfigs = await getActiveAutomatedEmailsForEvent('domain_completed')

  if (emailConfigs.length === 0) {
    console.log('No active automated email found for domain_completed event')
    return
  }

  // Use the first email config with delayDays=0 (typically immediate send)
  // For domain completions, we typically only want immediate sends
  const emailConfig = emailConfigs.find((e) => e.delayDays === 0) || emailConfigs[0]

  // Get user profile for name
  const profile = await prisma.profile.findUnique({
    where: { id: completionRecord.user_id },
    select: {
      fullName: true,
      username: true,
    },
  })

  const userName = profile?.fullName || profile?.username || undefined

  // Generate subject with domain name substitution
  let subject = emailConfig.subject.replace('[Domain Name]', completionRecord.domain_id)

  // Generate certificate URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'
  const certificateUrl = `${appUrl}/certificates/${completionRecord.domain_id}`

  // Send domain completion email using general notification template
  const sendResult = await sendGeneralNotificationEmail(userEmail, {
    title: subject,
    message: `Congratulations! You've completed the ${completionRecord.domain_id} domain. View your certificate and continue your learning journey.`,
    actionUrl: certificateUrl,
    actionText: 'View Certificate',
    userName,
  })

  if (sendResult.success) {
    console.log(`Domain completion email sent to ${userEmail} for domain ${completionRecord.domain_id}`)
  } else {
    console.error(`Failed to send domain completion email to ${userEmail}:`, sendResult.error)
  }
}

/**
 * POST /api/webhooks/db-trigger
 * Handle Supabase Database Webhooks for automated email triggers
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Exact match check
    const expectedAuth = `Bearer ${webhookSecret}`
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
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
      const body = await request.json()

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
        console.warn('Unknown webhook payload format, attempting fallback:', Object.keys(body))
        payload = {
          type: 'INSERT',
          table: 'users',
          record: body,
        }
      }
    } catch (error) {
      console.error('Error parsing webhook payload:', error)
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      )
    }

    const { type, table, record } = payload
    console.log(`Received webhook: ${type} on ${table}`, { recordId: record?.id, recordEmail: record?.email })

    // Handle auth.users INSERT (user signup)
    // Note: Supabase webhooks on auth.users might not work directly
    // This handles both webhook format and direct calls from triggers
    if ((table === 'users' || table === 'auth.users') && type === 'INSERT') {
      await handleNewUser(supabaseAdmin, record)
      return NextResponse.json({ success: true, message: 'User signup processed' })
    }

    // Handle domain_completions INSERT
    if (table === 'domain_completions' && type === 'INSERT') {
      await handleDomainCompletion(supabaseAdmin, record)
      return NextResponse.json({ success: true, message: 'Domain completion processed' })
    }

    // Unknown event
    console.log(`Unknown webhook event: ${type} on ${table}`)
    return NextResponse.json({ success: true, message: 'Event not handled' })
  } catch (error) {
    console.error('Error in db-trigger webhook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

