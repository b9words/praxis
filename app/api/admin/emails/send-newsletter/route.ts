import { requireRole } from '@/lib/auth/authorize'
import { getAutomatedEmailById, updateAutomatedEmail } from '@/lib/db/automatedEmails'
import { getAllNewsletterSubscribers } from '@/lib/db/newsletterSubscribers'
import { sendGeneralNotificationEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma/server'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

/**
 * POST /api/admin/emails/send-newsletter
 * Send a newsletter to all subscribers
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin'])

    const body = await request.json()
    const { newsletterId } = body

    if (!newsletterId) {
      return NextResponse.json(
        { error: 'newsletterId is required' },
        { status: 400 }
      )
    }

    // Get the newsletter
    const newsletter = await getAutomatedEmailById(newsletterId)
    if (!newsletter || newsletter.type !== 'NEWSLETTER') {
      return NextResponse.json(
        { error: 'Newsletter not found' },
        { status: 404 }
      )
    }

    // Get all subscribers
    const subscribers = await getAllNewsletterSubscribers()
    
    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers found' },
        { status: 400 }
      )
    }

    // Also get all users with email notifications enabled
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

    // Get all users with email notifications enabled (from Prisma)
    // Handle case where emailNotificationsEnabled column doesn't exist
    let profiles: Array<{ id: string }> = []
    try {
      profiles = await prisma.profile.findMany({
        where: {
          emailNotificationsEnabled: true,
        },
        select: {
          id: true,
        },
      })
    } catch (error: any) {
      // If column doesn't exist, get all profiles (assume all want notifications)
      const { isColumnNotFoundError } = await import('@/lib/db/utils')
      if (isColumnNotFoundError(error)) {
        profiles = await prisma.profile.findMany({
          select: {
            id: true,
          },
        })
      } else {
        throw error
      }
    }

    const userIds = profiles.map(p => p.id)
    const allEmails: string[] = []

    // Get emails from Supabase auth
    for (const userId of userIds) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authUser?.user?.email) {
        allEmails.push(authUser.user.email)
      }
    }

    // Add newsletter subscribers
    const subscriberEmails = subscribers.map(s => s.email)
    const uniqueEmails = Array.from(new Set([...allEmails, ...subscriberEmails]))

    // Send emails
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const email of uniqueEmails) {
      try {
        const result = await sendGeneralNotificationEmail(email, {
          title: newsletter.subject,
          message: newsletter.summary || newsletter.subject,
        })

        if (result.success) {
          sent++
        } else {
          failed++
          errors.push(`${email}: ${result.error || 'Unknown error'}`)
        }
      } catch (error: any) {
        failed++
        errors.push(`${email}: ${error.message || 'Unknown error'}`)
      }
    }

    // Update newsletter with publishedAt
    await updateAutomatedEmail(newsletterId, {
      publishedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: uniqueEmails.length,
      errors: errors.slice(0, 10), // Limit errors in response
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error sending newsletter:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
}


