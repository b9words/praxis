import { isMissingTable } from '@/lib/api/route-helpers'
import { requireAuth } from '@/lib/auth/authorize'
import { ensureUserArticleProgressTable } from '@/lib/db/schemaGuard'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const articleId = searchParams.get('articleId')
    const status = searchParams.get('status')

    const where: any = {
      userId: user.id,
    }

    if (articleId) {
      where.articleId = articleId
    }
    if (status) {
      where.status = status
    }

    // Handle P2021 (missing table) errors
    let progress
    try {
      progress = await prisma.userArticleProgress.findMany({
      where,
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
          updatedAt: 'desc',
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
            progress = await prisma.userArticleProgress.findMany({
              where,
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
                updatedAt: 'desc',
              },
            })
          } catch (retryError) {
            // Still failed, return empty array
            return NextResponse.json({ progress: [] }, { status: 200 })
          }
        } else {
          // Non-dev: return empty array
          return NextResponse.json({ progress: [] }, { status: 200 })
        }
      } else {
        // Other errors: return empty array
        return NextResponse.json({ progress: [] }, { status: 200 })
      }
    }

    return NextResponse.json({ progress })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching article progress:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { articleId, status = 'in_progress' } = body

    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 })
    }

    const progress = await prisma.userArticleProgress.upsert({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId,
        },
      },
      update: {
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
      create: {
        userId: user.id,
        articleId,
        status,
        completedAt: status === 'completed' ? new Date() : null,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ progress }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    // Handle missing table (P2021) - try to create in dev
    if (isMissingTable(error)) {
      if (process.env.NODE_ENV === 'development') {
        await ensureUserArticleProgressTable()
        // Don't retry for POST - user should retry manually
      }
      return NextResponse.json({ error: 'Database table not ready' }, { status: 503 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error creating article progress:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { articleId, status } = body

    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 })
    }

    const progress = await prisma.userArticleProgress.update({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId,
        },
      },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ progress })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    // Handle missing table (P2021) - try to create in dev
    if (isMissingTable(error)) {
      if (process.env.NODE_ENV === 'development') {
        await ensureUserArticleProgressTable()
        // Don't retry for PUT - user should retry manually
      }
      return NextResponse.json({ error: 'Database table not ready' }, { status: 503 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating article progress:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 })
    }

    await prisma.userArticleProgress.delete({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    // Handle missing table (P2021) - try to create in dev
    if (isMissingTable(error)) {
      if (process.env.NODE_ENV === 'development') {
        await ensureUserArticleProgressTable()
      }
      return NextResponse.json({ error: 'Database table not ready' }, { status: 503 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error deleting article progress:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

