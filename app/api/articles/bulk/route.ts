
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

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

    const created = await prisma.article.createMany({
      data: articles.map((article) => ({
        title: article.title,
        content: article.content || null,
        competencyId: article.competencyId,
        status: article.status || 'draft',
        storagePath: article.storagePath || null,
        metadata: article.metadata || {},
        description: article.description || null,
        createdBy: user.id,
        updatedBy: user.id,
      })),
    })

    return NextResponse.json({ success: true, count: created.count }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error creating bulk articles:', error)
    return NextResponse.json({ error: 'Failed to create articles' }, { status: 500 })
  }
}
