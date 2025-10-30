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
  } catch (error) {
    console.error('Error fetching competencies:', error)
    return NextResponse.json({ error: 'Failed to fetch competencies' }, { status: 500 })
  }
}

