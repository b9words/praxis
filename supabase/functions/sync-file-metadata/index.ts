import { parse } from 'https://deno.land/x/frontmatter@v0.1.4/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  bucket: string
  path: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const { bucket, path }: SyncRequest = await req.json()

    if (!bucket || !path) {
      return new Response(
        JSON.stringify({ error: 'Missing bucket or path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Syncing file: ${bucket}/${path}`)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path)

    if (downloadError) {
      console.error('Download error:', downloadError)
      return new Response(
        JSON.stringify({ error: `Failed to download file: ${downloadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get file content as text
    const content = await fileData.text()
    const fileExtension = path.split('.').pop()?.toLowerCase()

    // Parse based on file type
    if (fileExtension === 'md') {
      // Parse markdown with frontmatter
      return await syncMarkdownArticle(supabase, path, content)
    } else if (fileExtension === 'json') {
      // Parse JSON case file
      return await syncJsonCase(supabase, path, content)
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported file type: ${fileExtension}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function syncMarkdownArticle(supabase: any, storagePath: string, content: string) {
  try {
    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = parse(content)
    
    // Extract metadata
    const title = frontmatter.title || 'Untitled'
    const description = frontmatter.description || ''
    const competencyId = frontmatter.competency_id || null
    
    const metadata = {
      duration: frontmatter.duration || 12,
      difficulty: frontmatter.difficulty || 'intermediate',
      domain: frontmatter.domain || '',
      module: frontmatter.module || '',
      lesson_number: frontmatter.lesson_number || 0,
      ...frontmatter // Include all other frontmatter fields
    }

    // First, try to find existing article by storage_path
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
          status: frontmatter.status || 'published',
          published: frontmatter.published ?? (frontmatter.status === 'published' ? true : false),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) {
        throw updateError
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'updated',
          article_id: existing.id,
          message: `Article updated: ${title}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
          status: frontmatter.status || 'published',
          published: frontmatter.published ?? (frontmatter.status === 'published' ? true : false),
          content: null // Content is in storage
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          action: 'inserted',
          article_id: inserted.id,
          message: `Article created: ${title}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      duration: caseData.duration || 60,
      competencies: caseData.competencies || [],
      persona: caseData.persona || {},
      ...caseData.metadata // Any additional metadata
    }

    // First, try to find existing case by storage_path
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
          status: caseData.status || 'published',
          published: caseData.published ?? (caseData.status === 'published' ? true : false),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) {
        throw updateError
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          action: 'updated',
          case_id: existing.id,
          message: `Case updated: ${title}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Insert new case
      const { data: inserted, error: insertError } = await supabase
        .from('cases')
        .insert({
          title,
          description,
          storage_path: storagePath,
          metadata,
          status: caseData.status || 'published',
          published: caseData.published ?? (caseData.status === 'published' ? true : false),
          briefing_doc: null, // Content is in storage
          datasets: null,
          rubric: caseData.rubric || {}
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          action: 'inserted',
          case_id: inserted.id,
          message: `Case created: ${title}` 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('JSON sync error:', error)
    throw error
  }
}

