import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'editor'])

    const competencies = await prisma.competency.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        parentId: true,
      },
      orderBy: [
        { level: 'asc' },
        { displayOrder: 'asc' },
      ],
    })

    const response = NextResponse.json(competencies)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error: any) {
    console.error('[admin/content/competencies] Error:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

