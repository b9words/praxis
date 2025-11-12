import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'editor'])

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const competency = searchParams.get('competency') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50', 10), 100)
    const sort = searchParams.get('sort') || 'updatedAt:desc'

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { competency: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status && status !== '__all__') {
      where.status = status
    }

    if (competency) {
      where.competency = { name: competency }
    }

    let items: any[] = []
    let total = 0

    try {
      const [itemsResult, totalResult] = await Promise.all([
        prisma.article.findMany({
          where,
          select: {
            id: true,
            title: true,
            status: true,
            published: true,
            updatedAt: true,
            storagePath: true,
            metadata: true,
            competency: { select: { name: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.article.count({ where }),
      ])
      items = itemsResult
      total = totalResult
    } catch (dbError: any) {
      // Handle Prisma errors gracefully
      console.error('[admin/content/articles] Database error:', dbError)
      // Return empty result instead of crashing
      items = []
      total = 0
    }

    console.log(`[admin/content/articles] Found ${total} total articles, returning ${items.length} items for page ${page}`)
    if (items.length > 0) {
      console.log(`[admin/content/articles] Sample article IDs:`, items.slice(0, 3).map(a => a.id))
    }

    const response = NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error: any) {
    console.error('[admin/content/articles] Error:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

