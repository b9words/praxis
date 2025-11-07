import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { revalidateCache, CacheTags } from '@/lib/cache'

export const runtime = 'nodejs'
export const revalidate = 0

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'editor'])

    const { id } = await params
    const { published } = await request.json()

    if (typeof published !== 'boolean') {
      return NextResponse.json({ error: 'Invalid published value' }, { status: 400 })
    }

    const article = await prisma.article.update({
      where: { id },
      data: { published },
      select: {
        id: true,
        title: true,
        published: true,
      },
    })

    // Invalidate cache for articles
    await revalidateCache(CacheTags.ARTICLES)
    await revalidateCache('library')
    await revalidateCache('curriculum')

    return NextResponse.json(article)
  } catch (error: any) {
    console.error('[admin/content/articles/publish] Error:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

