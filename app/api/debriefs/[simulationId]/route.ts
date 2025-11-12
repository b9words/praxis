import { getCurrentUser } from '@/lib/auth/get-user'
import { getDebriefBySimulationId } from '@/lib/db/debriefs'
import { verifySimulationOwnership } from '@/lib/db/simulations'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/debriefs/[simulationId]
 * Get debrief for a simulation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { simulationId } = await params

    // Verify ownership
    const isOwner = await verifySimulationOwnership(simulationId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get debrief with full includes
    const debrief = await getDebriefBySimulationId(simulationId)
    if (!debrief) {
      return NextResponse.json({ error: 'Debrief not found' }, { status: 404 })
    }

    return NextResponse.json({ debrief })
  } catch (error) {
    console.error('Error fetching debrief:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch debrief',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
