import { requireRole } from '@/lib/auth/authorize'
import { syncFileMetadata, uploadToStorage } from '@/lib/supabase/storage'
import fs from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin or editor
    await requireRole(['admin', 'editor'])

    // Get the local file path from request
    const { path: localPath } = await request.json()

    if (!localPath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    // Resolve the full file path
    const fullPath = path.join(process.cwd(), localPath)

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(fullPath)
    const filename = path.basename(localPath)
    
    // Determine storage path based on local path
    let storagePath = localPath
    if (localPath.startsWith('content/curriculum/')) {
      // Convert content/curriculum/domain/module/lesson.md -> articles/domain/module/lesson.md
      storagePath = localPath.replace('content/curriculum/', 'articles/')
    } else if (localPath.startsWith('content/cases/')) {
      // Convert content/cases/year1/case.json -> cases/year1/case.json
      storagePath = localPath.replace('content/', '')
    } else if (localPath.startsWith('content/articles/')) {
      // Convert content/articles/year1/article.md -> articles/year1/article.md
      storagePath = localPath.replace('content/', '')
    }

    // Create a File object from the buffer
    const file = new File([fileBuffer], filename, {
      type: filename.endsWith('.md') ? 'text/markdown' : 'application/json'
    })

    // Upload to storage
    const uploadResult = await uploadToStorage(storagePath, file)

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.error}` },
        { status: 500 }
      )
    }

    // Sync metadata
    const syncResult = await syncFileMetadata('assets', storagePath)

    if (!syncResult.success) {
      return NextResponse.json(
        { error: `Metadata sync failed: ${syncResult.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${filename}`,
      storagePath,
      data: syncResult.data
    })
  } catch (error) {
    console.error('Sync local file error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

