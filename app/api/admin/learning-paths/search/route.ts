import { requireRole } from '@/lib/auth/authorize'
import { searchLessonsAndCases } from '@/lib/learning-paths'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/learning-paths/search
 * Search for lessons and cases to add to learning paths
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(['editor', 'admin'])

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const results = await searchLessonsAndCases(query, limit)

    return NextResponse.json(results)
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    
    console.error('Error searching lessons and cases:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}

