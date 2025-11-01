import { isMissingTable } from '@/lib/api/route-helpers'
import { ensureProfileExists } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { ensureUserArticleProgressTable } from '@/lib/db/schemaGuard'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/user/progress
 * Get user progress summary for navbar
 * Soft-fails: returns zeros if profile missing or table missing
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({
        currentResidency: null,
        articlesCompleted: 0,
        totalArticles: 0,
        simulationsCompleted: 0,
        progressPercentage: 0,
      }, { status: 200 })
    }

    // Ensure profile exists (non-blocking)
    await ensureProfileExists(user.id, user.email || undefined)

    // Get user residency
    const residency = await prisma.userResidency.findUnique({
      where: { userId: user.id },
      select: { currentResidency: true },
    })

    if (!residency?.currentResidency) {
      return NextResponse.json({
        currentResidency: null,
        articlesCompleted: 0,
        totalArticles: 0,
        simulationsCompleted: 0,
        progressPercentage: 0,
      })
    }

    const residencyYear = residency.currentResidency

    // Get articles for current residency
    const totalArticles = await prisma.article.count({
      where: {
        competency: {
          residencyYear,
        },
        status: 'published',
      },
    })

    // Get completed articles - handle P2021 (missing table)
    let articlesCompleted = 0
    try {
      articlesCompleted = await prisma.userArticleProgress.count({
        where: {
          userId: user.id,
          status: 'completed',
          article: {
            competency: {
              residencyYear,
            },
          },
        },
      })
    } catch (error: any) {
      // Handle missing table (P2021)
      if (isMissingTable(error)) {
        // In dev, try to create the table
        if (process.env.NODE_ENV === 'development') {
          await ensureUserArticleProgressTable()
          
          // Retry once after creating table
          try {
            articlesCompleted = await prisma.userArticleProgress.count({
              where: {
                userId: user.id,
                status: 'completed',
                article: {
                  competency: {
                    residencyYear,
                  },
                },
              },
            })
          } catch (retryError) {
            // Still failed, use default 0
            articlesCompleted = 0
          }
        } else {
          // Non-dev: use default 0
          articlesCompleted = 0
        }
      } else {
        // Other errors: use default 0
        articlesCompleted = 0
      }
    }

    // Get completed simulations
    const simulationsCompleted = await prisma.simulation.count({
      where: {
        userId: user.id,
        status: 'completed',
      },
    })

    const progressPercentage = totalArticles > 0 ? Math.round((articlesCompleted / totalArticles) * 100) : 0

    return NextResponse.json({
      currentResidency: residencyYear,
      articlesCompleted,
      totalArticles,
      simulationsCompleted,
      progressPercentage,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      // Return empty progress instead of 401 to prevent auth loops
      return NextResponse.json({
        currentResidency: null,
        articlesCompleted: 0,
        totalArticles: 0,
        simulationsCompleted: 0,
        progressPercentage: 0,
      }, { status: 200 })
    }
    // Silently return empty progress if profile doesn't exist yet
    if (error instanceof Error && error.message.includes('Profile not found')) {
      return NextResponse.json({
        currentResidency: null,
        articlesCompleted: 0,
        totalArticles: 0,
        simulationsCompleted: 0,
        progressPercentage: 0,
      }, { status: 200 })
    }
    console.error('Error fetching user progress:', error)
    // Return empty progress to prevent refresh loops
    return NextResponse.json({
      currentResidency: null,
      articlesCompleted: 0,
      totalArticles: 0,
      simulationsCompleted: 0,
      progressPercentage: 0,
    }, { status: 200 })
  }
}
