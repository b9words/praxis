import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const competencyId = searchParams.get('competencyId')

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
    const user = await requireRole(['editor', 'admin'])
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

