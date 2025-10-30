import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('   For admin operations, add SUPABASE_SERVICE_ROLE_KEY to bypass RLS')
  process.exit(1)
}

console.log(`🔑 Using ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon'} key`)

const supabase = createClient(supabaseUrl, supabaseKey)

interface ArticleFrontmatter {
  title: string
  competency: string
  domain: string
  year: number
  order: number
  status: 'draft' | 'in_review' | 'approved' | 'published'
}

interface CaseFrontmatter {
  title: string
  competency: string[]
  domain: string
  year: number
  order: number
  status: 'draft' | 'in_review' | 'approved' | 'published'
  difficulty?: string
  estimated_time?: string
}

async function importArticles() {
  console.log('📚 Importing articles from markdown files...\n')

  const articlesDir = path.join(process.cwd(), 'content', 'articles')
  const articleFiles: string[] = []

  // Recursively find all .md files
  function findMarkdownFiles(dir: string) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        findMarkdownFiles(fullPath)
      } else if (file.endsWith('.md')) {
        articleFiles.push(fullPath)
      }
    }
  }

  findMarkdownFiles(articlesDir)

  console.log(`Found ${articleFiles.length} article files\n`)

  let imported = 0
  let updated = 0
  let errors = 0

  for (const filePath of articleFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent) as { 
        data: ArticleFrontmatter, 
        content: string 
      }

      // Validate required fields
      if (!frontmatter.title || !frontmatter.competency || !content.trim()) {
        console.log(`⚠️  Skipping ${path.basename(filePath)}: Missing required fields`)
        continue
      }

      // Check if article already exists
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('title', frontmatter.title)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('articles')
          .update({
            content,
            status: frontmatter.status || 'draft',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) {
          console.log(`❌ Error updating ${frontmatter.title}: ${error.message}`)
          errors++
        } else {
          console.log(`✅ Updated: ${frontmatter.title}`)
          updated++
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('articles')
          .insert({
            title: frontmatter.title,
            competency_id: frontmatter.competency,
            content,
            status: frontmatter.status || 'draft'
          })

        if (error) {
          console.log(`❌ Error inserting ${frontmatter.title}: ${error.message}`)
          errors++
        } else {
          console.log(`✨ Created: ${frontmatter.title}`)
          imported++
        }
      }
    } catch (error: any) {
      console.log(`❌ Error processing ${path.basename(filePath)}: ${error.message}`)
      errors++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Created: ${imported}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Errors: ${errors}`)
}

async function importCases() {
  console.log('\n🎯 Importing cases from markdown files...\n')

  const casesDir = path.join(process.cwd(), 'content', 'cases')
  
  if (!fs.existsSync(casesDir)) {
    console.log('⚠️  Cases directory not found, skipping...')
    return
  }

  const caseFiles: string[] = []
  
  // Recursively find all .md files in cases directory
  function findMarkdownFiles(dir: string) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      if (fs.statSync(filePath).isDirectory()) {
        findMarkdownFiles(filePath)
      } else if (file.endsWith('.md')) {
        caseFiles.push(filePath)
      }
    }
  }
  
  findMarkdownFiles(casesDir)
  
  console.log(`Found ${caseFiles.length} case files\n`)

  let imported = 0
  let updated = 0
  let errors = 0

  for (const filePath of caseFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent) as {
        data: CaseFrontmatter,
        content: string
      }

      // Validate required fields
      if (!frontmatter.title || !content.trim()) {
        console.log(`⚠️  Skipping ${path.basename(filePath)}: Missing required fields`)
        continue
      }

      // Generate slug from title
      const slug = frontmatter.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      // Check if case exists
      const { data: existing } = await supabase
        .from('cases')
        .select('id')
        .eq('title', frontmatter.title)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('cases')
          .update({
            slug: slug,
            briefing_doc: content,
            status: frontmatter.status || 'draft',
            year: frontmatter.year,
            order: frontmatter.order,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) {
          console.log(`❌ Error updating ${frontmatter.title}: ${error.message}`)
          errors++
        } else {
          console.log(`✅ Updated: ${frontmatter.title}`)
          updated++
        }
      } else {
        const { data: newCase, error } = await supabase
          .from('cases')
          .insert({
            title: frontmatter.title,
            slug: slug,
            briefing_doc: content,
            status: frontmatter.status || 'draft',
            year: frontmatter.year,
            order: frontmatter.order
          })
          .select('id')
          .single()

        if (error) {
          console.log(`❌ Error creating ${frontmatter.title}: ${error.message}`)
          errors++
        } else {
          console.log(`✨ Created: ${frontmatter.title}`)
          imported++

          // Insert into case_competencies if competency array exists
          if (newCase && frontmatter.competency && frontmatter.competency.length > 0) {
            const caseCompetencies = frontmatter.competency.map(comp_id => ({
              case_id: newCase.id,
              competency_id: comp_id,
            }))
            const { error: compError } = await supabase
              .from('case_competencies')
              .insert(caseCompetencies)
            if (compError) {
              console.log(`  ⚠️  Error linking competencies: ${compError.message}`)
            }
          }
        }
      }
    } catch (error: any) {
      console.log(`❌ Error processing ${path.basename(filePath)}: ${error.message}`)
      errors++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Created: ${imported}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Errors: ${errors}`)
}

async function main() {
  console.log('🚀 Praxis Content Import System\n')
  console.log('================================\n')
  
  await importArticles()
  await importCases()
  
  console.log('\n✅ Import complete!\n')
}

main().catch(console.error)

