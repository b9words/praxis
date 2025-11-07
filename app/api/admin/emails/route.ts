import { requireRole } from '@/lib/auth/authorize'
import { listAutomatedEmails, createAutomatedEmail } from '@/lib/db/automatedEmails'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

const VALID_TEMPLATES = ['welcome', 'simulation_complete', 'weekly_summary', 'general', 'subscription_confirmation']
const VALID_EVENT_NAMES = ['user_signed_up', 'domain_completed', 'user_inactive', 'newsletter']
const VALID_TYPES = ['DRIP', 'NEWSLETTER']

/**
 * GET /api/admin/emails
 * List all email campaigns (both drip and newsletter)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'editor'])

    const emails = await listAutomatedEmails()

    return NextResponse.json({
      emails: emails.map(e => ({
        id: e.id,
        eventName: e.eventName,
        subject: e.subject,
        template: e.template,
        delayDays: e.delayDays,
        isActive: e.isActive,
        name: e.name || null,
        type: e.type || 'DRIP', // Default to DRIP for existing records
        summary: e.summary || null,
        publishedAt: e.publishedAt ? e.publishedAt.toISOString() : null,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error fetching email campaigns:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to fetch email campaigns' }, { status: 500 })
  }
}

/**
 * POST /api/admin/emails
 * Create a new email campaign or newsletter
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'editor'])

    const body = await request.json()
    const { eventName, subject, template, delayDays, isActive, name, type, summary } = body

    // Validation
    if (!subject || !template) {
      return NextResponse.json(
        { error: 'subject and template are required' },
        { status: 400 }
      )
    }

    // For newsletters, eventName can be 'newsletter' or omitted
    const finalEventName = eventName || (type === 'NEWSLETTER' ? 'newsletter' : 'user_signed_up')
    
    if (type === 'NEWSLETTER' && finalEventName !== 'newsletter') {
      return NextResponse.json(
        { error: 'Newsletters must have eventName "newsletter"' },
        { status: 400 }
      )
    }

    if (type !== 'NEWSLETTER' && !VALID_EVENT_NAMES.includes(finalEventName)) {
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

    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
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
        eventName: finalEventName,
        subject,
        template,
        delayDays: delayDays ?? 0,
        isActive: isActive !== undefined ? isActive : true,
        name,
        type: type || 'DRIP',
        summary,
      })

      return NextResponse.json({
        email: {
          id: email.id,
          eventName: email.eventName,
          subject: email.subject,
          template: email.template,
          delayDays: email.delayDays,
          isActive: email.isActive,
          name: email.name,
          type: email.type,
          summary: email.summary,
          publishedAt: email.publishedAt,
          createdAt: email.createdAt,
          updatedAt: email.updatedAt,
        },
      }, { status: 201 })
    } catch (error: any) {
      throw error
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error creating email campaign:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to create email campaign' }, { status: 500 })
  }
}

