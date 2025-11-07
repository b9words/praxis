import { createClient as createServerClient } from '@/lib/supabase/server'
import matter from 'gray-matter'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const STORAGE_BUCKET = 'assets'

/**
 * POST /api/storage/sync
 * Sync file metadata to database
 * Body: { bucket: string, path: string }
 * 
 * This API route directly syncs metadata from storage files to the database,
 * replacing the Edge Function for simpler deployment and maintenance.
 */
export async function POST(request: NextRequest) {
  try {
    // Allow service role auth for scripts (check for service role key in header)
    const authHeader = request.headers.get('authorization')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const isServiceRoleAuth = serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`
    
    if (!isServiceRoleAuth) {
      // Fall back to normal role-based auth for UI users
      
    }

    const body = await request.json()
    const { bucket, path } = body

    if (!bucket || !path) {
      return NextResponse.json({ error: 'Missing bucket or path' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path)

    if (downloadError) {
      console.error('Download error:', downloadError)
      return NextResponse.json({ error: `Failed to download file: ${downloadError.message}` }, { status: 500 })
    }

    // Get file content as text
    const content = await fileData.text()
    const fileExtension = path.split('.').pop()?.toLowerCase()

    // Parse based on file type
    if (fileExtension === 'md') {
      return await syncMarkdownArticle(supabase, path, content)
    } else if (fileExtension === 'json') {
      return await syncJsonCase(supabase, path, content)
    } else {
      return NextResponse.json({ error: `Unsupported file type: ${fileExtension}` }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error syncing metadata:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to sync metadata' }, { status: 500 })
  }
}

async function syncMarkdownArticle(supabase: any, storagePath: string, content: string) {
  try {
    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content)
    
    const title = frontmatter.title || storagePath.split('/').pop()?.replace('.md', '') || 'Untitled'
    const description = frontmatter.description || markdownContent.substring(0, 200).trim()
    const competencyId = frontmatter.competency_id || null
    
    const metadata = {
      domain: frontmatter.domain,
      module: frontmatter.module,
      lesson_number: frontmatter.lesson_number,
      duration: frontmatter.duration || 12,
      difficulty: frontmatter.difficulty || 'intermediate',
      ...frontmatter.metadata // Any additional metadata
    }

    // Find existing article by storage_path
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('storage_path', storagePath)
      .maybeSingle()

    if (existing) {
      // Update existing article
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title,
          description,
          metadata,
          status: frontmatter.status || 'draft',
          published: frontmatter.published ?? (frontmatter.status === 'published' ? true : false),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({ 
        success: true, 
        action: 'updated',
        article_id: existing.id,
        message: `Article updated: ${title}` 
      })
    } else {
      // Insert new article
      const { data: inserted, error: insertError } = await supabase
        .from('articles')
        .insert({
          title,
          description,
          competency_id: competencyId,
          storage_path: storagePath,
          metadata,
          status: frontmatter.status || 'draft',
          published: frontmatter.published ?? (frontmatter.status === 'published' ? true : false),
          content: null // Content is in storage
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      return NextResponse.json({ 
        success: true,
        action: 'inserted',
        article_id: inserted.id,
        message: `Article created: ${title}` 
      })
    }
  } catch (error) {
    console.error('Markdown sync error:', error)
    throw error
  }
}

async function syncJsonCase(supabase: any, storagePath: string, content: string) {
  try {
    // Parse JSON
    const caseData = JSON.parse(content)
    
    // Extract metadata
    const title = caseData.title || 'Untitled Case'
    const description = caseData.description || caseData.briefing?.overview || ''
    
    const metadata = {
      difficulty: caseData.difficulty || 'intermediate',
      duration: caseData.duration || caseData.estimatedDuration || 60,
      competencies: caseData.competencies || [],
      persona: caseData.persona || {},
      ...caseData.metadata // Any additional metadata
    }

    // Find existing case by storage_path
    const { data: existing } = await supabase
      .from('cases')
      .select('id')
      .eq('storage_path', storagePath)
      .maybeSingle()

    if (existing) {
      // Update existing case
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          title,
          description,
          metadata,
          status: caseData.status || 'draft',
          published: caseData.published ?? (caseData.status === 'published' ? true : false),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({ 
        success: true,
        action: 'updated',
        case_id: existing.id,
        message: `Case updated: ${title}` 
      })
    } else {
      // Insert new case
      const { data: inserted, error: insertError } = await supabase
        .from('cases')
        .insert({
          title,
          description,
          storage_path: storagePath,
          metadata,
          status: caseData.status || 'draft',
          published: caseData.published ?? (caseData.status === 'published' ? true : false),
          briefing_doc: null // Content is in storage
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      return NextResponse.json({ 
        success: true,
        action: 'inserted',
        case_id: inserted.id,
        message: `Case created: ${title}` 
      })
    }
  } catch (error) {
    console.error('JSON case sync error:', error)
    throw error
  }
}
