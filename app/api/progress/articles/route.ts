import { requireAuth } from '@/lib/auth/authorize'
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

    const progress = await prisma.userArticleProgress.findMany({
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

    return NextResponse.json({ progress })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching article progress:', error)
    return NextResponse.json({ error: 'Failed to fetch article progress' }, { status: 500 })
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
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error creating article progress:', error)
    return NextResponse.json({ error: 'Failed to create article progress' }, { status: 500 })
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
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error updating article progress:', error)
    return NextResponse.json({ error: 'Failed to update article progress' }, { status: 500 })
  }
}

