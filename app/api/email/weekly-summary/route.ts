import { sendWeeklySummaries } from '@/lib/weekly-summary'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/email/weekly-summary
 * Calculate and send weekly summary emails to users
 * Called by pg_cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication for cron job in production
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET

    // In production, CRON_SECRET must be set and match
    if (!expectedSecret) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
      }
      // Allow in development without secret for testing
    } else if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use the extracted function from lib
    const result = await sendWeeklySummaries()

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to process weekly summaries',
          details: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      totalUsers: result.totalUsers,
      emailsSent: result.emailsSent,
      emailsFailed: result.emailsFailed,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Error in weekly summary cron:', error)
    return NextResponse.json(
      { error: 'Failed to process weekly summaries' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/email/weekly-summary
 * Test endpoint to manually trigger weekly summary (for testing)
 */
export async function GET(request: NextRequest) {
  // Only allow in development or with admin auth
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // Call POST handler
  return POST(request)
}

