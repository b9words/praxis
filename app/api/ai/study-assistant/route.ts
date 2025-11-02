import { getCurrentUser } from '@/lib/auth/get-user'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    const body = await request.json()

    const { articleId, userQuestion } = body

    if (!articleId || !userQuestion) {
      return NextResponse.json(
        { error: 'Missing required fields: completion articleId and userQuestion' },
        { status: 400 }
      )
    }

    // Call the Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 })
    }

    // Get session token for authenticated request
    const sessionHeader = request.headers.get('authorization')
    
    const response = await fetch(`${supabaseUrl}/functions/v1/ask-study-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': sessionHeader || '',
      },
      body: JSON.stringify({
        articleId,
        userQuestion,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge function error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get answer from study assistant' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error in study assistant API:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

