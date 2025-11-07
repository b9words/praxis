import { requireRole } from '@/lib/auth/authorize'
import { listAutomatedEmails, createAutomatedEmail } from '@/lib/db/automatedEmails'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

const VALID_TEMPLATES = ['welcome', 'simulation_complete', 'weekly_summary', 'general', 'subscription_confirmation']
const VALID_EVENT_NAMES = ['user_signed_up', 'domain_completed', 'user_inactive']

/**
 * GET /api/admin/automated-emails
 * List all automated emails
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin'])

    const emails = await listAutomatedEmails()

    return NextResponse.json({
      emails: emails.map(e => ({
        id: e.id,
        eventName: e.eventName,
        subject: e.subject,
        template: e.template,
        delayDays: e.delayDays,
        isActive: e.isActive,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error fetching automated emails:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to fetch automated emails' }, { status: 500 })
  }
}

/**
 * POST /api/admin/automated-emails
 * Create a new automated email
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin'])

    const body = await request.json()
    const { eventName, subject, template, delayDays, isActive } = body

    // Validation
    if (!eventName || !subject || !template) {
      return NextResponse.json(
        { error: 'eventName, subject, and template are required' },
        { status: 400 }
      )
    }

    if (!VALID_EVENT_NAMES.includes(eventName)) {
      return NextResponse.json(
        { error: `eventName must be one of: ${VALID_EVENT_NAMES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!VALID_TEMPLATES.includes(template)) {
      return NextResponse.json(
        { error: `template must be one of: ${VALID_TEMPLATES.join(', ')}` },
        { status: 400 }
      )
    }

    if (delayDays !== undefined && (typeof delayDays !== 'number' || delayDays < 0)) {
      return NextResponse.json(
        { error: 'delayDays must be a non-negative number' },
        { status: 400 }
      )
    }

    try {
      const email = await createAutomatedEmail({
        eventName,
        subject,
        template,
        delayDays: delayDays ?? 0,
        isActive: isActive !== undefined ? isActive : true,
      })

      return NextResponse.json({
        email: {
          id: email.id,
          eventName: email.eventName,
          subject: email.subject,
          template: email.template,
          delayDays: email.delayDays,
          isActive: email.isActive,
          createdAt: email.createdAt,
          updatedAt: email.updatedAt,
        },
      }, { status: 201 })
    } catch (error: any) {
      // Multiple emails per event are now allowed, so no unique constraint error handling needed
      throw error
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error creating automated email:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to create automated email' }, { status: 500 })
  }
}

