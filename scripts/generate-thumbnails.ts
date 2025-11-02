/**
 * Script to generate the first 3 thumbnails for testing
 * Run with: npx tsx scripts/generate-thumbnails.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function generateThumbnail(contentId: string, contentType: 'lesson' | 'case') {
  console.log(`\n🖼️  Generating thumbnail for ${contentType} ${contentId}...`)

  // Get the edge function URL - adjust for your deployment
  const functionUrl = `${supabaseUrl}/functions/v1/generate-thumbnail`

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        contentId,
        contentType,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ Thumbnail generated: ${result.url}`)
    return result.url
  } catch (error) {
    console.error(`❌ Error generating thumbnail:`, error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting thumbnail generation for first 3 items...\n')

  try {
    // Get first 2 articles (lessons)
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('status', 'published')
      .limit(2)
      .order('created_at', { ascending: true })

    if (articlesError) {
      console.error('❌ Error fetching articles:', articlesError)
      process.exit(1)
    }

    if (!articles || articles.length === 0) {
      console.error('❌ No published articles found')
      process.exit(1)
    }

    // Get first case study
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('id, title')
      .eq('status', 'published')
      .limit(1)
      .order('created_at', { ascending: true })

    if (casesError) {
      console.error('❌ Error fetching cases:', casesError)
      process.exit(1)
    }

    if (!cases || cases.length === 0) {
      console.warn('⚠️  No published cases found, will generate 2 lesson thumbnails only')
    }

    const results: Array<{ type: string; id: string; title: string; url?: string }> = []

    // Generate thumbnails
    console.log(`\n📋 Found ${articles.length} article(s) and ${cases?.length || 0} case(s)\n`)

    // Generate first lesson thumbnail
    if (articles.length > 0) {
      console.log(`📚 Article 1: ${articles[0].title}`)
      const url1 = await generateThumbnail(articles[0].id, 'lesson')
      results.push({ type: 'lesson', id: articles[0].id, title: articles[0].title, url: url1 })
    }

    // Generate second lesson thumbnail
    if (articles.length > 1) {
      console.log(`📚 Article 2: ${articles[1].title}`)
      const url2 = await generateThumbnail(articles[1].id, 'lesson')
      results.push({ type: 'lesson', id: articles[1].id, title: articles[1].title, url: url2 })
    }

    // Generate case study thumbnail
    if (cases && cases.length > 0) {
      console.log(`📊 Case Study: ${cases[0].title}`)
      const url3 = await generateThumbnail(cases[0].id, 'case')
      results.push({ type: 'case', id: cases[0].id, title: cases[0].title, url: url3 })
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ Thumbnail Generation Complete!')
    console.log('='.repeat(60))
    console.log('\nGenerated thumbnails:')
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.type === 'lesson' ? '📚 Lesson' : '📊 Case Study'}`)
      console.log(`   Title: ${result.title}`)
      console.log(`   URL: ${result.url}`)
    })
    console.log('\n')

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main()

