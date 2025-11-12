import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'editor'])

    let competencies: any[] = []
    try {
      competencies = await prisma.competency.findMany({
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
    } catch (dbError: any) {
      // Handle Prisma errors gracefully
      console.error('[admin/content/competencies] Database error:', dbError)
      // Return empty array instead of crashing
      competencies = []
    }

    const response = NextResponse.json(competencies)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error: any) {
    console.error('[admin/content/competencies] Error:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    // Return empty array on error instead of 500
    return NextResponse.json([], { status: 200 })
  }
}

