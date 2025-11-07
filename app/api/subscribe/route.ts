import { createNewsletterSubscriber } from '@/lib/db/newsletterSubscribers'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

/**
 * POST /api/subscribe
 * Subscribe an email to the newsletter
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    try {
      await createNewsletterSubscriber(email)

      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to newsletter',
      })
    } catch (error: any) {
      // If it's a unique constraint error, that's fine - they're already subscribed
      if (error.message?.includes('Unique constraint') || error.message?.includes('unique')) {
        return NextResponse.json({
          success: true,
          message: 'You are already subscribed',
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}


