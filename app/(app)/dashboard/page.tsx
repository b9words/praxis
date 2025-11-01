import FocusedDashboard from '@/components/dashboard/FocusedDashboard'
import { getUserResidency } from '@/lib/auth/get-residency'
import { getCurrentUser } from '@/lib/auth/get-user'
import { cache, CacheTags } from '@/lib/cache'
import { getUserAggregateScores } from '@/lib/database-functions'
import { isEnumError } from '@/lib/prisma-enum-fallback'
import { prisma } from '@/lib/prisma/server'
import { getSmartRecommendations } from '@/lib/recommendation-engine'
import { redirect } from 'next/navigation'

// Cache residency articles count (shared data, changes when articles are published/unpublished)
const getCachedResidencyArticles = (residencyYear: number) => cache(
  async () => {
    try {
      return await prisma.article.findMany({
        where: {
          competency: {
            residencyYear,
          },
          status: 'published',
        },
        select: {
          id: true,
        },
      })
    } catch (error: any) {
      // If enum doesn't exist, fall back to querying without status filter
      if (error?.code === 'P2034' || error?.message?.includes('ContentStatus') || error?.message?.includes('42704')) {
        return await prisma.article.findMany({
          where: {
            competency: {
              residencyYear,
            },
          },
          select: {
            id: true,
          },
        })
      }
      throw error
    }
  },
  ['residency-articles', residencyYear.toString()],
  {
    tags: [CacheTags.ARTICLES, 'residency-articles'],
    revalidate: 3600, // 1 hour
  }
)()

// Cache community threads (shared data, changes frequently)
const getCachedCommunityThreads = cache(
  async () => {
    try {
      return await prisma.forumThread.findMany({
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
    } catch (error: any) {
      // Handle schema mismatches (e.g., metadata column doesn't exist)
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        // Try without any potential problematic fields
        try {
          return await prisma.forumThread.findMany({
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
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
        } catch (fallbackError) {
          console.error('Error fetching forum threads (fallback):', fallbackError)
          return []
        }
      }
      console.error('Error fetching forum threads:', error)
      return []
    }
  },
  ['community-threads'],
  {
    tags: [CacheTags.FORUM, 'community-threads'],
    revalidate: 300, // 5 minutes
  }
)

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Auth protection is handled by middleware
  if (!user) {
    redirect('/login')
    return
  }

  // Get user's residency info using unified helper with error handling
  let currentResidency: number | null = null
  let residencyError = false
  try {
    const residencyResult = await getUserResidency(user.id)
    currentResidency = residencyResult.currentResidency
  } catch (error) {
    console.error('Error fetching residency in dashboard:', error)
    residencyError = true
    // On error, don't redirect - show dashboard with null residency
    currentResidency = null
  }

  // TEMPORARILY DISABLED REDIRECT TO DEBUG LOOP ISSUE
  // Only redirect to onboarding if we're CERTAIN there's no residency AND no error occurred
  // If there's a Prisma error, we can't be sure if user has residency or not
  // Redirecting on error would cause infinite loops
  // if (!residencyError && currentResidency === null) {
  //   redirect('/onboarding')
  // }

  // Get residency progress if user has selected one
  let residencyData = null
  if (currentResidency) {
    try {
      // Get articles and simulations for current residency (cached)
      const articles = await getCachedResidencyArticles(currentResidency)

      const completedArticles = await prisma.userArticleProgress.findMany({
        where: {
          userId: user.id,
          status: 'completed',
        },
        select: {
          articleId: true,
        },
      }).catch((error) => {
        console.error('Error fetching completed articles:', error)
        return []
      })

      const completedArticleIds = new Set(completedArticles.map((a) => a.articleId))
      const articlesCompleted = articles.filter((a: { id: string }) => completedArticleIds.has(a.id)).length

      // Get completed simulations with enum fallback
      let completedSimulations: any[] = []
      try {
        completedSimulations = await prisma.simulation.findMany({
          where: {
            userId: user.id,
            status: 'completed',
          },
          select: {
            id: true,
            completedAt: true,
          },
        })
      } catch (error: any) {
        if (isEnumError(error)) {
          // Fallback: query without status filter, filter by completedAt
          try {
            const allSimulations = await prisma.simulation.findMany({
              where: {
                userId: user.id,
              },
              select: {
                id: true,
                completedAt: true,
              },
            })
            completedSimulations = allSimulations.filter((s: any) => s.completedAt !== null)
          } catch (fallbackError) {
            console.error('Error fetching completed simulations (fallback):', fallbackError)
          }
        } else {
          console.error('Error fetching completed simulations:', error)
        }
      }

      residencyData = {
        year: currentResidency,
        title: `Year ${currentResidency}: ${currentResidency === 1 ? 'The Operator\'s Residency' : 'Business Acumen Core'}`,
        articlesCompleted,
        totalArticles: articles.length,
        simulationsCompleted: completedSimulations.length,
        totalSimulations: 10, // Placeholder - should be dynamic
      }
    } catch (error) {
      console.error('Error fetching residency data:', error)
      // Continue with null residencyData - component should handle gracefully
    }
  }

  // Get smart recommendation with error handling
  let recommendation = null
  try {
    recommendation = await getSmartRecommendations(user.id)
  } catch (error) {
    console.error('Error fetching recommendations:', error)
  }

  // Get user's aggregate scores for Praxis Profile with error handling
  let aggregateScores = null
  try {
    aggregateScores = await getUserAggregateScores(user.id)
  } catch (error) {
    console.error('Error fetching aggregate scores:', error)
  }

  // Get community highlights for quality network (cached) with error handling
  let communityThreads: Awaited<ReturnType<typeof getCachedCommunityThreads>> = []
  try {
    communityThreads = await getCachedCommunityThreads()
  } catch (error) {
    console.error('Error fetching community threads:', error)
  }

  const communityHighlights = (communityThreads || []).map((thread) => ({
    id: thread.id,
    title: thread.title,
    author: thread.author.fullName || thread.author.username || 'Anonymous',
    engagement: thread._count.posts,
  }))

  // Get recent activities with error handling
  let recentArticles: any[] = []
  try {
    recentArticles = await prisma.userArticleProgress.findMany({
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
  } catch (error: any) {
    // Handle enum errors and schema mismatches
    if (error?.code === 'P2034' || error?.message?.includes('does not exist') || error?.code === 'P2022') {
      try {
        // Fallback query without enum dependencies
        recentArticles = await prisma.userArticleProgress.findMany({
          where: {
            userId: user.id,
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
      } catch (fallbackError) {
        console.error('Error fetching recent articles (fallback):', fallbackError)
      }
    } else {
      console.error('Error fetching recent articles:', error)
    }
  }

  let recentSimulations: any[] = []
  try {
    recentSimulations = await prisma.simulation.findMany({
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
  } catch (error: any) {
    // Handle enum errors and schema mismatches
    if (isEnumError(error) || error?.code === 'P2022' || error?.message?.includes('does not exist')) {
      try {
        // Fallback query without enum dependencies
        recentSimulations = await prisma.simulation.findMany({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            createdAt: true,
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
      } catch (fallbackError) {
        console.error('Error fetching recent simulations (fallback):', fallbackError)
      }
    } else {
      console.error('Error fetching recent simulations:', error)
    }
  }

  // Combine recent activities
  const recentActivities = [
    ...(recentArticles || []).map((a) => ({
      id: a.article.id,
      type: 'article' as const,
      title: a.article.title,
      completedAt: a.completedAt?.toISOString() || '',
      competency: a.article.competency?.name,
    })),
    ...(recentSimulations || []).map((s) => ({
      id: s.id,
      type: 'simulation' as const,
      title: s.case.title,
      completedAt: s.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5)

  // Calculate learning streak with error handling
  let allProgress: any[] = []
  try {
    allProgress = await prisma.userArticleProgress.findMany({
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
  } catch (error) {
    console.error('Error fetching all progress:', error)
  }

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
