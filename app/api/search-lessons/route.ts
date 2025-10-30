import { searchLessons } from '@/lib/lesson-search'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchLessons(query)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error searching lessons:', error)
    return NextResponse.json(
      { error: 'Failed to search lessons' },
      { status: 500 }
    )
  }
}

