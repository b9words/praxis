import { requireRole } from '@/lib/auth/authorize'
import { getAutomatedEmailById, updateAutomatedEmail, deleteAutomatedEmail } from '@/lib/db/automatedEmails'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

const VALID_TEMPLATES = ['welcome', 'simulation_complete', 'weekly_summary', 'general', 'subscription_confirmation']
const VALID_EVENT_NAMES = ['user_signed_up', 'domain_completed', 'user_inactive', 'newsletter']
const VALID_TYPES = ['DRIP', 'NEWSLETTER']

/**
 * PUT /api/admin/emails/[id]
 * Update an email campaign
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'editor'])

    const { id } = await params
    const body = await request.json()
    const { eventName, subject, template, delayDays, isActive, name, type, summary, publishedAt } = body

    // Validation
    if (template && !VALID_TEMPLATES.includes(template)) {
      return NextResponse.json(
        { error: `template must be one of: ${VALID_TEMPLATES.join(', ')}` },
        { status: 400 }
      )
    }

    if (eventName && !VALID_EVENT_NAMES.includes(eventName)) {
      return NextResponse.json(
        { error: `eventName must be one of: ${VALID_EVENT_NAMES.join(', ')}` },
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
      const email = await updateAutomatedEmail(id, {
        eventName,
        subject,
        template,
        delayDays,
        isActive,
        name,
        type,
        summary,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
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
      })
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
    console.error('Error updating email campaign:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to update email campaign' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/emails/[id]
 * Delete an email campaign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'editor'])

    const { id } = await params

    await deleteAutomatedEmail(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error deleting email campaign:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to delete email campaign' }, { status: 500 })
  }
}


