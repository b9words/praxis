import { requireAuth } from '@/lib/auth/authorize'
import { notifyDebriefGenerationFailure } from '@/lib/notifications/triggers'
import { prisma } from '@/lib/prisma/server'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limit store (simple implementation for GA)
// In production, consider using Redis or similar
const rateLimitStore = new Map<string, { count: number; refusedAt: number }>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.refusedAt < fiveMinutesAgo) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function checkRateLimit(userId: string, ip: string): boolean {
  const key = userId || `ip:${ip}`
  const now = Date.now()
  const oneMinuteAgo = now - 60 * 1000

  const entry = rateLimitStore.get(key)
  if (entry) {
    // Check if window expired
    if (entry.refusedAt < oneMinuteAgo) {
      // Reset after 1 minute - start new window
      rateLimitStore.set(key, { count: 1, refusedAt: now })
      return true
    }
    // Check if limit exceeded
    if (entry.count >= 3) {
      // Update refusedAt to track when limit was hit
      entry.refusedAt = now
      return false
    }
    entry.count++
    entry.refusedAt = now // Update window start
  } else {
    rateLimitStore.set(key, { count: 1, refusedAt: now })
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { simulationId } = body

    if (!simulationId) {
      return NextResponse.json(
        { error: 'Missing required field: simulationId' },
        { status: 400 }
      )
    }

    // Check if debrief already exists (idempotency)
    const existingDebrief = await prisma.debrief.findUnique({
      where: { simulationId },
      select: {
        id: true,
        scores: true,
        summaryText: true,
        radarChartData: true,
        createdAt: true,
      },
    })

    if (existingDebrief) {
      return NextResponse.json({
        debriefId: existingDebrief.id,
        debrief: existingDebrief,
        fromCache: true,
      })
    }

    // Rate limiting: 3 requests per minute per user
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userId = user.id

    if (!checkRateLimit(userId, ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before generating another debrief.' },
        { status: 429 }
      )
    }

    // Call the Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
    }

    // Get session token for authenticated request
    const sessionHeader = request.headers.get('authorization')
    
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-debrief`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': sessionHeader || '',
      },
      body: JSON.stringify({
        simulationId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge function error:', errorText)
      
      // Track failure count (using simulationId as key for persistence tracking)
      const failureKey = `debrief_fail_${simulationId}`
      const existingFailures = rateLimitStore.get(failureKey)
      const failureCount = existingFailures ? existingFailures.count + 1 : 1
      rateLimitStore.set(failureKey, { count: failureCount, refusedAt: Date.now() })
      
      Sentry.addBreadcrumb({
        category: 'debrief',
        level: 'error',
        message: 'Debrief generation failed',
        data: { simulationId, status: response.status, error: errorText, failureCount },
      })
      Sentry.captureException(new Error(`Debrief generation failed: ${errorText}`))
      
      // Notify user if this is the 3rd+ failure
      if (failureCount >= 3) {
        try {
          await notifyDebriefGenerationFailure(user.id, simulationId, failureCount)
        } catch (notifError) {
          console.error('Failed to send debrief failure notification:', notifError)
          // Don't fail the request if notification fails
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to generate debrief' },
        { status: response.status }
      )
    }
    
    // Clear failure count on success
    const failureKey = `debrief_fail_${simulationId}`
    rateLimitStore.delete(failureKey)

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error in generate debrief API:', error)
    Sentry.addBreadcrumb({
      category: 'debrief',
      level: 'error',
      message: 'Debrief API error',
      data: { error: error instanceof Error ? error.message : String(error), normalized },
    })
    Sentry.captureException(error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

