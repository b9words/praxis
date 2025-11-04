import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const STORAGE_BUCKET = 'assets'

/**
 * GET /api/case-generation/list-assets
 * List all case files for a case study with their on-disk status
 * Checks both local filesystem and Supabase Storage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    if (!caseId) {
      return NextResponse.json(
        { error: 'Missing caseId query parameter' },
        { status: 400 }
      )
    }

    // Try to load case from local data directory first
    let caseData: any = null
    const casePath = path.join(process.cwd(), 'data', 'case-studies', `${caseId}.json`)
    
    if (fs.existsSync(casePath)) {
      const caseContent = fs.readFileSync(casePath, 'utf-8')
      caseData = JSON.parse(caseContent)
    } else {
      // Try to load from Supabase Storage
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
          
          // Try common storage paths
          const possiblePaths = [
            `cases/year1/${caseId}.json`,
            `cases/${caseId}.json`,
            `cases/year1/*/${caseId}.json`,
          ]
          
          for (const storagePath of possiblePaths) {
            const { data, error } = await supabase.storage
              .from(STORAGE_BUCKET)
              .download(storagePath)
            
            if (!error && data) {
              const content = await data.text()
              caseData = JSON.parse(content)
              break
            }
          }
        } catch (storageError) {
          console.warn('Failed to load from storage:', storageError)
        }
      }
      
      if (!caseData) {
        return NextResponse.json(
          { error: 'Case not found in local filesystem or storage' },
          { status: 404 }
        )
      }
    }

    // Initialize Supabase client for storage checks
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabase = (supabaseUrl && supabaseServiceKey)
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null

    // Check each file's existence (local filesystem and/or storage)
    const assets = await Promise.all((caseData.caseFiles || []).map(async (file: any) => {
      let exists = false
      let filePath: string | null = null
      let fileSize: number | null = null
      let lastGeneratedAt: string | null = null

      if (file.source?.type === 'REFERENCE' && file.source.path) {
        // Check local filesystem
        const relativePath = file.source.path.replace(/^content\/sources\//, '')
        const localPath = path.join(process.cwd(), 'content', 'sources', relativePath)
        
        if (fs.existsSync(localPath)) {
          exists = true
          filePath = file.source.path
          const stats = fs.statSync(localPath)
          fileSize = stats.size
          lastGeneratedAt = stats.mtime.toISOString()
        } else if (supabase) {
          // Check Supabase Storage
          const storagePath = `cases/${caseId}/assets/${file.fileName}`
          try {
            const { data: storageData, error: storageError } = await supabase.storage
              .from(STORAGE_BUCKET)
              .download(storagePath)
            
            if (!storageError && storageData) {
              exists = true
              filePath = storagePath
              // Get file metadata
              const { data: fileInfo } = await supabase.storage
                .from(STORAGE_BUCKET)
                .list(path.dirname(storagePath), {
                  search: path.basename(storagePath),
                })
              
              if (fileInfo && fileInfo.length > 0) {
                fileSize = fileInfo[0].metadata?.size || null
                lastGeneratedAt = fileInfo[0].updated_at || fileInfo[0].created_at || null
              }
            }
          } catch (err) {
            // Storage check failed, continue with exists=false
          }
        }
      } else if (file.source?.type === 'STATIC') {
        exists = true // Static content is inline
        fileSize = (file.source.content || '').length
        // For STATIC content, use the inline content directly as preview
        if (file.source.content) {
          const content = file.source.content
          preview = content.length > 500 ? content.substring(0, 500) + '...' : content
        }
      }

      // Load preview content if file exists and preview not already set (from STATIC)
      if (exists && !preview && filePath) {
        try {
          const relativePath = filePath.replace(/^content\/sources\//, '')
          const localPath = path.join(process.cwd(), 'content', 'sources', relativePath)
          
          if (fs.existsSync(localPath)) {
            const content = fs.readFileSync(localPath, 'utf-8')
            // Truncate to first 2000 characters for preview (more content visible)
            preview = content.length > 2000 ? content.substring(0, 2000) + '\n\n... (truncated)' : content
          }
        } catch (err) {
          // Preview loading failed, continue without preview
          console.warn(`Failed to load preview for ${filePath}:`, err)
        }
      }

      return {
        fileId: file.fileId,
        fileName: file.fileName,
        fileType: file.fileType,
        sourceType: file.source?.type || 'UNKNOWN',
        exists,
        filePath: file.source?.path || null,
        fileSize,
        lastGeneratedAt,
        canRegenerate: true, // All assets can be regenerated
        preview, // Include preview content
      }
    }))

    return NextResponse.json({
      caseId,
      caseTitle: caseData.title || 'Untitled Case',
      assets,
      totalAssets: assets.length,
      existingAssets: assets.filter((a: any) => a.exists).length,
      // Include core case content
      caseContent: {
        description: caseData.description,
        stages: caseData.stages || [],
        rubric: caseData.rubric,
        competencies: caseData.competencies || [],
        estimatedDuration: caseData.estimatedDuration,
        difficulty: caseData.difficulty,
        hasStages: (caseData.stages || []).length > 0,
        hasRubric: !!caseData.rubric,
      }
    })
  } catch (error) {
    console.error('Error listing assets:', error)
    return NextResponse.json(
      {
        error: 'Failed to list assets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

