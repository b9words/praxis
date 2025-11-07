import { getPublishedNewsletters } from '@/lib/db/automatedEmails'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

/**
 * GET /api/newsletters
 * Get all published newsletters for the public archive
 */
export async function GET(request: NextRequest) {
  try {
    const newsletters = await getPublishedNewsletters()

    return NextResponse.json({
      newsletters: newsletters.map(n => ({
        id: n.id,
        subject: n.subject,
        summary: n.summary,
        publishedAt: n.publishedAt,
        name: n.name,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching newsletters:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to fetch newsletters' }, { status: 500 })
  }
}


