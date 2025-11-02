import { getCurrentUser } from '@/lib/auth/get-user'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const STORAGE_BUCKET = 'assets'

/**
 * GET /api/storage?path=...
 * Fetch file content from Supabase Storage
 */
export async function GET(request: NextRequest) {
  try {
    // All auth checks removed
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path)

    if (error) {
      console.error('Storage download error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const content = await data.text()
    return NextResponse.json({ success: true, content })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error fetching from storage:', error)
    return NextResponse.json({ error: 'Failed to fetch from storage' }, { status: 500 })
  }
}
