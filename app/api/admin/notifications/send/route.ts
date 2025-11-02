import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import {
  sendWelcomeEmail,
  sendSimulationCompleteEmail,
  sendWeeklySummaryEmail,
  sendGeneralNotificationEmail,
  sendSubscriptionConfirmationEmail,
} from '@/lib/email'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

type EmailTemplateType = 
  | 'welcome'
  | 'simulation_complete'
  | 'weekly_summary'
  | 'general'
  | 'subscription_confirmation'

interface SendEmailRequest {
  template: EmailTemplateType
  recipients: 'all' | 'selected'
  selectedEmails?: string
  // Template-specific params
  userName?: string
  loginUrl?: string
  caseTitle?: string
  debriefUrl?: string
  articlesCompleted?: number
  simulationsCompleted?: number
  lessonsCompleted?: number
  title?: string
  message?: string
  actionUrl?: string
  actionText?: string
  planName?: string
}

/**
 * POST /api/admin/notifications/send
 * Send email notifications to users via Resend
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: SendEmailRequest = await request.json()

    // Validate required fields
    if (!body.template || !body.recipients) {
      return NextResponse.json(
        { error: 'Template and recipients are required' },
        { status: 400 }
      )
    }

    // Validate template-specific required fields
    if (body.template === 'simulation_complete' && !body.caseTitle) {
      return NextResponse.json(
        { error: 'caseTitle is required for simulation_complete template' },
        { status: 400 }
      )
    }

    if (body.template === 'general' && (!body.title || !body.message)) {
      return NextResponse.json(
        { error: 'title and message are required for general template' },
        { status: 400 }
      )
    }

    if (body.template === 'subscription_confirmation' && !body.planName) {
      return NextResponse.json(
        { error: 'planName is required for subscription_confirmation template' },
        { status: 400 }
      )
    }

    // Get recipient emails
    let emails: string[] = []

    if (body.recipients === 'all') {
      // Use Supabase Admin API to get all user emails
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json(
          { error: 'Supabase configuration missing' },
          { status: 500 }
        )
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      // List all users from auth
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError || !authUsers) {
        console.error('Error fetching users from Supabase:', authError)
        return NextResponse.json(
          { error: 'Failed to fetch user emails from Supabase auth' },
          { status: 500 }
        )
      }

      emails = authUsers.users
        .map(u => u.email)
        .filter((email): email is string => !!email && email.includes('@'))
    } else {
      // Parse selected emails
      const emailLines = body.selectedEmails?.split('\n') || []
      emails = emailLines
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.includes('@'))
    }

    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'No valid email addresses found' },
        { status: 400 }
      )
    }

    // Send emails
    const results = await Promise.allSettled(
      emails.map(async (email) => {
        try {
          switch (body.template) {
            case 'welcome':
              return await sendWelcomeEmail(email, body.userName)

            case 'simulation_complete':
              if (!body.caseTitle) throw new Error('caseTitle required')
              return await sendSimulationCompleteEmail(
                email,
                body.caseTitle,
                body.debriefUrl,
                body.userName
              )

            case 'weekly_summary':
              return await sendWeeklySummaryEmail(email, {
                userName: body.userName,
                articlesCompleted: body.articlesCompleted,
                simulationsCompleted: body.simulationsCompleted,
                lessonsCompleted: body.lessonsCompleted,
              })

            case 'general':
              if (!body.title || !body.message) {
                throw new Error('title and message required')
              }
              return await sendGeneralNotificationEmail(email, {
                title: body.title,
                message: body.message,
                actionUrl: body.actionUrl,
                actionText: body.actionText,
                userName: body.userName,
              })

            case 'subscription_confirmation':
              if (!body.planName) throw new Error('planName required')
              return await sendSubscriptionConfirmationEmail(
                email,
                body.planName,
                body.userName
              )

            default:
              throw new Error(`Unknown template: ${body.template}`)
          }
        } catch (error) {
          throw new Error(
            `Failed to send to ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      })
    )

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - sent
    const errors = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => 
        r.status === 'rejected' 
          ? r.reason?.message || 'Unknown error'
          : r.value.error || 'Unknown error'
      )

    return NextResponse.json({
      success: sent > 0,
      sent,
      failed,
      total: emails.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send notifications' },
      { status: 500 }
    )
  }
}

