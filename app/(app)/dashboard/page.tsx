import FocusedDashboard from '@/components/dashboard/FocusedDashboard'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getUserAggregateScores } from '@/lib/database-functions'
import { prisma } from '@/lib/prisma/server'
import { getSmartRecommendations } from '@/lib/recommendation-engine'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Get user's residency info
  const userResidency = await prisma.userResidency.findUnique({
    where: { userId: user.id },
    select: { currentResidency: true },
  })

  // If user hasn't completed onboarding, redirect to onboarding
  if (!userResidency?.currentResidency) {
    redirect('/onboarding')
  }

  // Get residency progress if user has selected one
  let residencyData = null
  if (userResidency) {
    // Get articles and simulations for current residency
    const articles = await prisma.article.findMany({
      where: {
        competency: {
          residencyYear: userResidency.currentResidency,
        },
        status: 'published',
      },
      select: {
        id: true,
      },
    })

    const completedArticles = await prisma.userArticleProgress.findMany({
      where: {
        userId: user.id,
        status: 'completed',
      },
      select: {
        articleId: true,
      },
    })

    const completedArticleIds = new Set(completedArticles.map((a) => a.articleId))
    const articlesCompleted = articles.filter((a) => completedArticleIds.has(a.id)).length

    // Get completed simulations
    const completedSimulations = await prisma.simulation.findMany({
      where: {
        userId: user.id,
        status: 'completed',
      },
      select: {
        id: true,
      },
    })

    residencyData = {
      year: userResidency.currentResidency,
      title: `Year ${userResidency.currentResidency}: ${userResidency.currentResidency === 1 ? 'The Operator\'s Residency' : 'Business Acumen Core'}`,
      articlesCompleted,
      totalArticles: articles.length,
      simulationsCompleted: completedSimulations.length,
      totalSimulations: 10, // Placeholder - should be dynamic
    }
  }

  // Get smart recommendation
  const recommendation = await getSmartRecommendations(user.id)

  // Get user's aggregate scores for Praxis Profile
  const aggregateScores = await getUserAggregateScores(user.id)

  // Get community highlights for quality network
  const communityThreads = await prisma.forumThread.findMany({
    include: {
      author: {
        select: {
          username: true,
          fullName: true,
        },
      },
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  const communityHighlights = communityThreads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    author: thread.author.fullName || thread.author.username || 'Anonymous',
    engagement: thread._count.posts,
  }))

  // Get recent activities
  const recentArticles = await prisma.userArticleProgress.findMany({
    where: {
      userId: user.id,
      status: 'completed',
    },
    include: {
      article: {
        select: {
          id: true,
          title: true,
          competency: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
    take: 5,
  })

  const recentSimulations = await prisma.simulation.findMany({
    where: {
      userId: user.id,
    },
    include: {
      case: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 3,
  })

  // Combine recent activities
  const recentActivities = [
    ...recentArticles.map((a) => ({
      id: a.article.id,
      type: 'article' as const,
      title: a.article.title,
      completedAt: a.completedAt?.toISOString() || '',
      competency: a.article.competency?.name,
    })),
    ...recentSimulations.map((s) => ({
      id: s.id,
      type: 'simulation' as const,
      title: s.case.title,
      completedAt: s.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)

  // Calculate learning streak
  const allProgress = await prisma.userArticleProgress.findMany({
    where: {
      userId: user.id,
      completedAt: {
        not: null,
      },
    },
    select: {
      completedAt: true,
    },
    orderBy: {
      completedAt: 'desc',
    },
  })

  let currentStreak = 0
  if (allProgress.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedDates = new Set(
      allProgress
        .filter((p) => p.completedAt)
        .map((p) => {
          const date = new Date(p.completedAt!)
          date.setHours(0, 0, 0, 0)
          return date.getTime()
        })
    )

    // Calculate current streak
    let checkDate = new Date(today)
    while (completedDates.has(checkDate.getTime())) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  return (
    <FocusedDashboard
      user={user}
      recommendation={recommendation}
      residencyData={residencyData}
      currentStreak={currentStreak}
      recentActivities={recentActivities}
      aggregateScores={aggregateScores}
      communityHighlights={communityHighlights}
    />
  )
}
