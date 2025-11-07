import { bulkCreateArticles } from '@/lib/db/articles'
import { AppError } from '@/lib/db/utils'
import { revalidateCache, CacheTags } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/articles/bulk
 * Bulk create articles
 * Body: { articles: Array<{ title, content, competencyId, status, ... }> }
 */
export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    
    const body = await request.json()
    const { articles } = body

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: 'Articles array required' }, { status: 400 })
    }

    const created = await bulkCreateArticles(articles, user.id)

    // Revalidate caches
    await revalidateCache(CacheTags.ARTICLES)
    await revalidateCache('admin')
    await revalidateCache('content')

    return NextResponse.json({ success: true, count: created.count }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error creating bulk articles:', error)
    return NextResponse.json({ error: 'Failed to create articles' }, { status: 500 })
  }
}
