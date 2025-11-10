import { getCurrentUser } from '@/lib/auth/get-user'
import { notifySimulationComplete } from '@/lib/notifications/triggers'
import { getSimulationById, updateSimulationStatus, verifySimulationOwnership } from '@/lib/db/simulations'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/case-studies/[id]/complete
 * Complete a case study and trigger side effects:
 * - Generate debrief
 * - Send notifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const { id } = await params

    // Verify ownership
    const isOwner = await verifySimulationOwnership(id, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get case study with case info
    const simulation = await getSimulationById(id)
    if (!simulation) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 })
    }

    if (simulation.status === 'completed') {
      return NextResponse.json({ error: 'Case study already completed' }, { status: 400 })
    }

    // Store case title before updating
    const caseTitle = simulation.case?.title || 'Case'

    // Mark case study as completed
    await updateSimulationStatus(id, 'completed')

    // Send notification
    await notifySimulationComplete(
      user.id,
      simulation.id,
      caseTitle
    )

    // Check domain completion for all domains (since cases may belong to multiple domains)
    // This is a best-effort check - we check all domains to see if any are now complete
    try {
      const { getEnhancedCurriculum } = await import('@/lib/enhanced-curriculum-integration')
      const { checkDomainCompletion } = await import('@/lib/progress-tracking')
      
      const enhancedCurriculum = getEnhancedCurriculum()
      
      // Check all domains that might contain this case
      const domainsToCheck = enhancedCurriculum
        .filter(domain => 
          domain.learningPath.some(item => 
            item.type === 'simulation' && 
            (item.simulationId === simulation.caseId || item.lesson === simulation.caseId)
          )
        )
        .map(domain => domain.domainId)

      // Check completion for relevant domains
      for (const domainId of domainsToCheck) {
        const completion = await checkDomainCompletion(user.id, domainId)
        if (completion) {
          // Domain completed - create notification with certificate link
          const { createNotification } = await import('@/lib/notifications/triggers')
          const { getDomainById } = await import('@/lib/curriculum-data')
          const domain = getDomainById(domainId)
          
          await createNotification({
            userId: user.id,
            type: 'domain_complete',
            title: 'Domain Completed!',
            message: `Congratulations! You've completed "${domain?.title || domainId}". View your certificate to celebrate your achievement.`,
            link: `/certificates/${domainId}`,
            metadata: {
              domainId,
              completedAt: completion.completedAt.toISOString(),
            },
          }).catch(err => console.error('Failed to create completion notification:', err))
        }
      }
    } catch (completionError) {
      // Don't fail case study completion if domain check fails
      console.error('Error checking domain completion:', completionError)
    }

    return NextResponse.json({ success: true, simulationId: id })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error completing case study:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

