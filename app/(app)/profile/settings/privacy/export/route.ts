import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { safeFindUnique } from '@/lib/prisma-safe'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    // Fetch all user data
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
      // Handle missing rubric_version column (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
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

    const [profile, simulations, lessonProgress, articleProgress, residency, subscriptionResult, notifications, domainCompletions] =
      await Promise.all([
        prisma.profile.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
            fullName: true,
            bio: true,
            avatarUrl: true,
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
        }),
        prisma.userLessonProgress.findMany({
          where: { userId: user.id },
        }),
        prisma.userArticleProgress.findMany({
          where: { userId: user.id },
        }),
        prisma.userResidency.findUnique({
          where: { userId: user.id },
        }),
        safeFindUnique<any>('subscription', { userId: user.id }),
        prisma.notification.findMany({
          where: { userId: user.id },
        }),
        prisma.domainCompletion.findMany({
          where: { userId: user.id },
        }),
      ])
    
    const subscription = subscriptionResult.data

    const exportData = {
      profile,
      simulations,
      debriefs,
      lessonProgress,
      articleProgress,
      residency,
      subscription,
      notifications,
      domainCompletions,
      exportedAt: new Date().toISOString(),
    }

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="praxis-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error exporting user data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

