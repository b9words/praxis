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
        { metadata: { path: ['competencyName'], string_contains: search } },
      ]
    }

    if (status && status !== '__all__') {
      where.status = status
    }

    if (competency) {
      where.competencies = {
        some: {
          competency: {
            name: competency,
          },
        },
      }
    }

    let items: any[] = []
    let total = 0

    try {
      const [itemsResult, totalResult] = await Promise.all([
        prisma.case.findMany({
          where,
          select: {
            id: true,
            title: true,
            status: true,
            published: true,
            updatedAt: true,
            storagePath: true,
            metadata: true,
            competencies: {
              select: {
                competency: {
                  select: { name: true },
                },
              },
              take: 1,
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.case.count({ where }),
      ])
      items = itemsResult
      total = totalResult
    } catch (dbError: any) {
      // Handle Prisma errors gracefully
      console.error('[admin/content/cases] Database error:', dbError)
      // Return empty result instead of crashing
      items = []
      total = 0
    }

    const response = NextResponse.json({
      items: items.map((c) => ({
        id: c.id,
        type: 'case' as const,
        title: c.title,
        status: c.status,
        published: c.published,
        updatedAt: c.updatedAt,
        competency: c.competencies?.[0]?.competency || undefined,
        storagePath: c.storagePath,
        metadata: {
          competencyName: (c.metadata as any)?.competencyName,
          competencies: (c.metadata as any)?.competencies || [],
        },
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error: any) {
    console.error('[admin/content/cases] Error:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

