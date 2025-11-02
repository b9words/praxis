import { getCurrentUser } from '@/lib/auth/get-user'
import { notifyDebriefGenerationFailure } from '@/lib/notifications/triggers'
import { createJob } from '@/lib/job-processor'
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
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
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

    // Create background job for debrief generation
    const job = await createJob('debrief_generation', {
      simulationId,
      userId: user.id,
    })

    // Return job ID immediately
    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: 'Debrief generation started. Poll /api/jobs/[jobId] for status.',
    })
  } catch (error) {
    const { createErrorResponse } = await import('@/lib/api/error-wrapper')
    return createErrorResponse(error, {
      defaultMessage: 'Failed to generate debrief',
      statusCode: 500,
    })
  }
}

