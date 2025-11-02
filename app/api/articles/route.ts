
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const competencyId = searchParams.get('competencyId')

    // Cache articles list (15 minutes revalidate)
    const getCachedArticles = cache(
      async () => {
        const where: any = {}
        if (status && status !== 'all') {
          where.status = status
        }
        if (competencyId) {
          where.competencyId = competencyId
        }

        const articles = await prisma.article.findMany({
          where,
          include: {
            competency: true,
            creator: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return articles
      },
      ['api', 'articles', status || 'all', competencyId || 'all'],
      {
        tags: [CacheTags.ARTICLES],
        revalidate: 900, // 15 minutes
      }
    )

    const articles = await getCachedArticles()

    return NextResponse.json({ articles })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const body = await request.json()

    const {
      competencyId,
      title,
      content,
      description,
      status = 'draft',
      storagePath,
      metadata,
    } = body

    if (!competencyId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const article = await prisma.article.create({
      data: {
        competencyId,
        title,
        content: content || null,
        description,
        status,
        storagePath,
        metadata: metadata || {},
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: {
        competency: true,
      },
    })

    return NextResponse.json({ article }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error creating article:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

