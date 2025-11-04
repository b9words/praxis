import { getCurrentUser } from '@/lib/auth/get-user'
import { cache, CacheTags } from '@/lib/cache'
import { listArticles, createArticle } from '@/lib/db/articles'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const competencyId = searchParams.get('competencyId')

    // Cache articles list (15 minutes revalidate)
    const getCachedArticles = cache(
      async () => {
        return listArticles({
          status: status || undefined,
          competencyId: competencyId || undefined,
        })
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
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
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

    const article = await createArticle({
      competencyId,
      title,
      content: content || null,
      description,
      status,
      storagePath: storagePath || null,
      metadata: metadata || {},
      createdBy: user.id,
      updatedBy: user.id,
    })

    return NextResponse.json({ article }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error creating article:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

