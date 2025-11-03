import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Collect all user data - comprehensive PII export for GDPR compliance
    let debriefs: any[] = []
    try {
      debriefs = await prisma.debrief.findMany({
        where: {
          simulation: {
            userId: user.id,
          },
        },
      })
    } catch (error: any) {
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          debriefs = await prisma.debrief.findMany({
            where: {
              simulation: {
                userId: user.id,
              },
            },
            select: {
              id: true,
              simulationId: true,
              scores: true,
              summaryText: true,
              radarChartData: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        } catch (fallbackError) {
          console.error('Error fetching debriefs (fallback):', fallbackError)
        }
      } else {
        throw error
      }
    }

    const [profile, simulations, lessonProgress, articleProgress, userResidency, notifications, domainCompletions] =
      await Promise.all([
        prisma.profile.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            isPublic: true,
            role: true,
            emailNotificationsEnabled: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.simulation.findMany({
          where: { userId: user.id },
          include: {
            case: {
              select: {
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.userLessonProgress.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.userArticleProgress.findMany({
          where: { userId: user.id },
        }),
        prisma.userResidency.findUnique({
          where: { userId: user.id },
        }),
        prisma.notification.findMany({
          where: { userId: user.id },
        }),
        prisma.domainCompletion.findMany({
          where: { userId: user.id },
        }),
      ])
    
    let subscription: any = null
    try {
      subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      })
    } catch (error: any) {
      if (!isMissingTable(error)) {
        console.error('Error fetching subscription:', error)
      }
    }

    // Compile export data with all PII
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      profile,
      userResidency,
      subscription,
      notifications,
      domainCompletions,
      simulations: simulations.map(sim => ({
        id: sim.id,
        caseId: sim.caseId,
        caseTitle: sim.case.title,
        status: sim.status,
        userInputs: sim.userInputs,
        startedAt: sim.startedAt,
        completedAt: sim.completedAt,
        createdAt: sim.createdAt,
        updatedAt: sim.updatedAt,
      })),
      debriefs: debriefs.map(debrief => ({
        id: debrief.id,
        simulationId: debrief.simulationId,
        scores: debrief.scores,
        summaryText: debrief.summaryText,
        radarChartData: debrief.radarChartData,
        createdAt: debrief.createdAt,
        updatedAt: debrief.updatedAt,
      })),
      lessonProgress: lessonProgress.map(progress => ({
        id: progress.id,
        domainId: progress.domainId,
        moduleId: progress.moduleId,
        lessonId: progress.lessonId,
        status: progress.status,
        progressPercentage: progress.progressPercentage,
        timeSpentSeconds: progress.timeSpentSeconds,
        completedAt: progress.completedAt,
        bookmarked: progress.bookmarked,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      })),
      articleProgress: articleProgress.map(progress => ({
        id: progress.id,
        articleId: progress.articleId,
        status: progress.status,
        completedAt: progress.completedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      })),
    }

    // Create a JSON blob
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    
    // For now, we'll return the data directly
    // In production, you might want to upload to S3 and return a signed URL
    return NextResponse.json({ 
      data: exportData,
      filename: `execemy-data-export-${new Date().toISOString().split('T')[0]}.json`
    })
  } catch (error) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error exporting user data:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

