import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await requireAuth()

    // Fetch all user data
    const [profile, simulations, debriefs, forumThreads, forumPosts, lessonProgress, articleProgress] =
      await Promise.all([
        prisma.profile.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
            fullName: true,
            bio: true,
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
        prisma.debrief.findMany({
          where: {
            simulation: {
              userId: user.id,
            },
          },
        }),
        prisma.forumThread.findMany({
          where: { authorId: user.id },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
          },
        }),
        prisma.forumPost.findMany({
          where: { authorId: user.id },
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        }),
        prisma.userLessonProgress.findMany({
          where: { userId: user.id },
        }),
        prisma.userArticleProgress.findMany({
          where: { userId: user.id },
        }),
      ])

    const exportData = {
      profile,
      simulations,
      debriefs,
      forumThreads,
      forumPosts,
      lessonProgress,
      articleProgress,
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

