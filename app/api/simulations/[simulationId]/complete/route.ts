import { getCurrentUser } from '@/lib/auth/get-user'
import { notifySimulationComplete } from '@/lib/notifications/triggers'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/simulations/[simulationId]/complete
 * Complete a simulation and trigger side effects:
 * - Generate debrief
 * - Create forum thread (if enabled)
 * - Send notifications
 */
export async function POST(
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

    // Get simulation with case and user info
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
    }

    if (simulation.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (simulation.status === 'completed') {
      return NextResponse.json({ error: 'Simulation already completed' }, { status: 400 })
    }

    // Store case title before updating (needed after update when TypeScript loses type info)
    const caseTitle = simulation.case.title

    // Mark simulation as completed
    try {
      await prisma.simulation.update({
        where: { id: simulationId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      })
    } catch (updateError: any) {
      // Handle P2025 (record not found) or any other Prisma errors
      if (updateError?.code === 'P2025') {
        return NextResponse.json({ error: 'Simulation not found' }, { status: 404 })
      }
      
      // For other errors, log and return error
      const { normalizeError } = await import('@/lib/api/route-helpers')
      const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
      const normalized = normalizeError(updateError)
      const statusCode = getPrismaErrorStatusCode(updateError)
      console.error('Error updating simulation status:', updateError)
      return NextResponse.json({ error: normalized }, { status: statusCode })
    }

    // Create forum thread for this simulation (if forum channels exist)
    try {
      let generalChannel: any = null
      try {
        generalChannel = await (prisma as any).forumChannel.findFirst({
          where: { slug: 'general' },
        })
      } catch (error: any) {
        // Forum tables don't exist, skip
      }

      if (generalChannel) {
        try {
          await (prisma as any).forumThread.create({
          data: {
            channelId: generalChannel.id,
            title: `Discussion: ${caseTitle}`,
            content: `Completed simulation "${caseTitle}" and would love to discuss insights and learnings with the community!`,
            authorId: user.id,
            metadata: {
              simulationId: simulation.id,
              caseId: simulation.caseId,
              autoCreated: true,
            },
          },
        })
        } catch (threadError) {
          // Don't fail the completion if forum thread creation fails
          console.error('Failed to create forum thread:', threadError)
        }
      }
    } catch (forumError) {
      // Don't fail the completion if forum thread creation fails
      console.error('Failed to check/create forum thread:', forumError)
    }

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
      // Don't fail simulation completion if domain check fails
      console.error('Error checking domain completion:', completionError)
    }

    return NextResponse.json({ success: true, simulationId })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    // Handle Prisma errors comprehensively
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error completing simulation:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

