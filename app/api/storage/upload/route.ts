import { requireRole } from '@/lib/auth/authorize'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const STORAGE_BUCKET = 'assets'

/**
 * POST /api/storage/upload
 * Upload a file to Supabase Storage
 * Body: FormData with 'file' and 'path' fields
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'editor']) // Only admins/editors can upload

    const formData = await request.formData()
    const file = formData.get('file') as File
    const path = formData.get('path') as string

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        upsert: true,
        contentType: file.type || 'text/plain'
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: data.path })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error uploading to storage:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
