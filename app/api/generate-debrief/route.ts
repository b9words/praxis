import { getCurrentUser } from '@/lib/auth/get-user'
import { getSimulationByIdFull, verifySimulationOwnership } from '@/lib/db/simulations'
import { getDebriefBySimulationId, upsertDebrief } from '@/lib/db/debriefs'
import { generateDebrief } from '@/lib/debrief/generator'
import { createJob, updateJob } from '@/lib/job-processor'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/generate-debrief
 * Generate or retrieve a debrief for a completed simulation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { simulationId } = body

    if (!simulationId) {
      return NextResponse.json({ error: 'Missing simulationId' }, { status: 400 })
    }

    // Verify ownership
    const isOwner = await verifySimulationOwnership(simulationId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if debrief already exists
    const existingDebrief = await getDebriefBySimulationId(simulationId)
    if (existingDebrief) {
      return NextResponse.json({
        fromCache: true,
        debriefId: existingDebrief.id,
        debrief: existingDebrief,
      })
    }

    // Get full simulation data
    const simulation = await getSimulationByIdFull(simulationId)
    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (simulation.status !== 'completed') {
      return NextResponse.json(
        { error: 'Simulation must be completed before generating debrief' },
        { status: 400 }
      )
    }

    // Create job for tracking
    const job = await createJob('debrief_generation', { simulationId, userId: user.id })

    try {
      // Generate debrief
      const result = await generateDebrief({
        id: simulation.id,
        userId: simulation.userId,
        caseId: simulation.caseId,
        userInputs: simulation.userInputs,
        case: {
          id: simulation.case.id,
          title: simulation.case.title,
          rubric: simulation.case.rubric as any,
          competencies: (simulation.case as any).competencies || [],
        },
      })

      // Persist debrief
      const debrief = await upsertDebrief({
        simulationId: simulation.id,
        scores: result.scores,
        summaryText: result.summaryText,
        radarChartData: result.radarChartData,
        rubricVersion: '1.0',
        goldStandardExemplar: result.goldStandardExemplar || null,
      })

      // Update job as completed
      await updateJob(job.id, {
        status: 'completed',
        result: { debriefId: debrief.id },
      })

      return NextResponse.json({
        success: true,
        debriefId: debrief.id,
        jobId: job.id,
      })
    } catch (error) {
      // Update job as failed
      await updateJob(job.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      console.error('Error generating debrief:', error)
      return NextResponse.json(
        {
          error: 'Failed to generate debrief',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in generate-debrief route:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
