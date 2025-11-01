import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const level = searchParams.get('level')
    const parentId = searchParams.get('parentId')
    const residencyYear = searchParams.get('residencyYear')

    const where: any = {}
    if (level) {
      where.level = level
    }
    if (parentId) {
      where.parentId = parentId
    } else if (parentId === null) {
      where.parentId = null
    }
    if (residencyYear) {
      where.residencyYear = parseInt(residencyYear)
    }

    const competencies = await prisma.competency.findMany({
      where,
      include: {
        parent: true,
        children: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ competencies })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching competencies:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

