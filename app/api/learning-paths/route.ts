import { getCurrentUser } from '@/lib/auth/get-user'
import { getAllLearningPaths, getLearningPathById } from '@/lib/learning-paths'
import { prisma } from '@/lib/prisma/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { cache, CacheTags, getCachedUserData } from '@/lib/cache'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  let user: any = null
  let rateLimitResult: any = null

  try {
    user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting: 30 requests per minute per user
    const ip = getClientIp(request)
    rateLimitResult = checkRateLimit(user.id, ip, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const pathId = searchParams.get('pathId')

    // If pathId is provided, return single path with progress
    if (pathId) {
      const path = await getLearningPathById(pathId)
      if (!path) {
        return NextResponse.json({ error: 'Learning path not found' }, { status: 404 })
      }

      // Cache user's progress for this path (2 minutes revalidate, userId in key)
      const getCachedPathProgress = getCachedUserData(
        user.id,
        async () => {
          const lessonProgress = await prisma.userLessonProgress.findMany({
            where: {
              userId: user.id,
            },
          })

      // Calculate progress for each item
      const itemsWithProgress = path.items.map((item) => {
        if (item.type === 'lesson') {
          const progress = lessonProgress.find(
            (p: any) => p.domainId === item.domain &&
                 p.moduleId === item.module &&
                 p.lessonId === item.lesson
            )
          return {
            ...item,
            completed: progress?.status === 'completed' || false,
            progress: progress?.progressPercentage || 0,
          }
        } else if (item.type === 'case') {
          // Check if user has completed the simulation
          const simulation = prisma.simulation.findFirst({
            where: {
              userId: user.id,
              caseId: item.caseId,
              status: 'completed',
            },
          }).catch(() => null)
          
          return {
            ...item,
            completed: false, // Will be updated when simulation query resolves
            progress: 0,
          }
        }
        return item
      })

      // Wait for simulation queries to complete
      const itemsWithFullProgress = await Promise.all(
        itemsWithProgress.map(async (item) => {
          if (item.type === 'case') {
            const simulation = await prisma.simulation.findFirst({
              where: {
                userId: user.id,
                caseId: item.caseId,
                status: 'completed',
              },
            }).catch(() => null)
            return {
              ...item,
              completed: !!simulation,
            }
          }
          return item
        })
      )

          const completedCount = itemsWithFullProgress.filter((item: any) => item.completed).length
          const totalItems = itemsWithFullProgress.length
          const progressPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

          return {
            ...path,
            items: itemsWithFullProgress,
            progress: {
              completed: completedCount,
              total: totalItems,
              percentage: progressPercentage,
            },
          }
        },
        ['learning-path', pathId],
        {
          tags: [CacheTags.CURRICULUM, CacheTags.USER_PROGRESS],
          revalidate: 120, // 2 minutes
        }
      )

      const pathWithProgress = await getCachedPathProgress()

      return NextResponse.json(
        {
          path: pathWithProgress,
        },
        {
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
          }
        }
      )
    }

    // Cache all paths with basic progress info (1 hour for paths, 2 minutes for progress)
    const getCachedAllPaths = cache(
      async () => getAllLearningPaths(),
      ['api', 'learning-paths', 'all'],
      {
        tags: [CacheTags.CURRICULUM],
        revalidate: 3600, // 1 hour
      }
    )

    // Cache user lesson progress (2 minutes revalidate, userId in key)
    const getCachedLessonProgress = getCachedUserData(
      user.id,
      () => prisma.userLessonProgress.findMany({
        where: {
          userId: user.id,
        },
      }),
      ['lesson', 'progress'],
      {
        tags: [CacheTags.USER_PROGRESS],
        revalidate: 120, // 2 minutes
      }
    )

    const [allPaths, lessonProgress] = await Promise.all([
      getCachedAllPaths(),
      getCachedLessonProgress(),
    ])

    const pathsWithProgress = await Promise.all(
      allPaths.map(async (path: any) => {
        let completedCount = 0
        const totalItems = path.items.length

        for (const item of path.items) {
          if (item.type === 'lesson') {
          const progress = lessonProgress.find(
            (p: any) => p.domainId === item.domain &&
                 p.moduleId === item.module &&
                 p.lessonId === item.lesson
            )
            if (progress?.status === 'completed') {
              completedCount++
            }
          } else if (item.type === 'case') {
            const simulation = await prisma.simulation.findFirst({
              where: {
                userId: user.id,
                caseId: item.caseId,
                status: 'completed',
              },
            }).catch(() => null)
            if (simulation) {
              completedCount++
            }
          }
        }

        return {
          ...path,
          progress: {
            completed: completedCount,
            total: totalItems,
            percentage: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
          },
        }
      })
    )

    return NextResponse.json(
      { paths: pathsWithProgress },
      {
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
        }
      }
    )
  } catch (error: any) {
    console.error('Error fetching learning paths:', error)
    
    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        route: '/api/learning-paths',
        method: 'GET',
      },
      extra: {
        userId: user?.id,
        pathId: request.nextUrl.searchParams.get('pathId'),
      },
    })

    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

