import { getCurrentUser } from '@/lib/auth/get-user'
import { getJobById } from '@/lib/job-processor'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/jobs/[jobId]
 * Get the status of a background job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = params

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      )
    }

    const job = await getJobById(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this job
    // For debrief jobs, check that the simulation belongs to the user
    if (job.type === 'debrief_generation') {
      const { prisma } = await import('@/lib/prisma/server')
      const simulationId = job.payload?.simulationId

      if (simulationId) {
        const simulation = await prisma.simulation.findUnique({
          where: { id: simulationId },
          select: { userId: true },
        })

        if (!simulation || simulation.userId !== user.id) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          )
        }
      }
    }

    // For other job types, check if userId matches (if present in payload)
    if (job.payload?.userId && job.payload.userId !== user.id) {
      // Admin users can view any job
      const { prisma } = await import('@/lib/prisma/server')
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true },
      })

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      payload: job.payload,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      processedAt: job.processedAt?.toISOString(),
    })
  } catch (error) {
    const { createErrorResponse } = await import('@/lib/api/error-wrapper')
    return createErrorResponse(error, {
      defaultMessage: 'Failed to get job status',
      statusCode: 500,
    })
  }
}