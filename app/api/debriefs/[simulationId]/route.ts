import { getCurrentUser } from '@/lib/auth/get-user'
import { getDebriefBySimulationId } from '@/lib/db/debriefs'
import { verifySimulationOwnership } from '@/lib/db/simulations'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ simulationId: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const { simulationId } = await params

    // Verify simulation ownership
    const isOwner = await verifySimulationOwnership(simulationId, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const debrief = await getDebriefBySimulationId(simulationId)

    if (!debrief) {
      return NextResponse.json({ error: 'Debrief not found' }, { status: 404 })
    }

    return NextResponse.json({ debrief })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching debrief:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

