import { NextResponse } from 'next/server'
import { createReadStream, statSync } from 'fs'
import { join, normalize } from 'path'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const mimeMap: Record<string, string> = {
    csv: 'text/csv',
    md: 'text/markdown',
    txt: 'text/plain',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    pdf: 'application/pdf',
  }
  return mimeMap[ext || ''] || 'application/octet-stream'
}

/**
 * Secure API route to serve case study source files
 * Validates paths to prevent directory traversal attacks
 */
export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
): Promise<NextResponse> {
  try {
    // Resolve base directory (content/sources)
    const baseDir = join(process.cwd(), 'execemy', 'content', 'sources')
    
    // Join all path segments and normalize
    const requestPath = join(...params.path)
    const resolvedPath = normalize(join(baseDir, requestPath))
    
    // Security: Ensure resolved path is within baseDir
    // This prevents directory traversal attacks (e.g., ../../../etc/passwd)
    if (!resolvedPath.startsWith(normalize(baseDir))) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      )
    }
    
    // Check if file exists and is not a directory
    let stat
    try {
      stat = statSync(resolvedPath)
      if (stat.isDirectory()) {
        return NextResponse.json(
          { error: 'Path is a directory, not a file' },
          { status: 400 }
        )
      }
      
      // Check file size
      if (stat.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File too large' },
          { status: 413 }
        )
      }
    } catch (error) {
      // File doesn't exist
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    
    // Determine content type
    const contentType = getMimeType(resolvedPath)
    
    // Create read stream
    const stream = createReadStream(resolvedPath)
    
    // Return stream with appropriate headers
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=60',
        'Content-Length': stat.size.toString(),
      },
    })
  } catch (error) {
    console.error('Error serving case content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

