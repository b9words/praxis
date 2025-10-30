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

      // Validate frontmatter
      const validation = validateArticleFrontmatter(frontmatter)
      if (!validation.valid) {
        console.log(`⚠️  Skipping ${path.basename(filePath)}: Validation errors:`)
        validation.errors.forEach(err => console.log(`   - ${err}`))
        errors++
        continue
      }

      // Validate required fields
      if (!frontmatter.title || !frontmatter.competency || !content.trim()) {
        console.log(`⚠️  Skipping ${path.basename(filePath)}: Missing required fields`)
        errors++
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

/**
 * Validate case study JSON structure against schema
 */
function validateCaseStudyJSON(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.caseId) errors.push('Missing required field: caseId')
  if (!data.version) errors.push('Missing required field: version')
  if (!data.title) errors.push('Missing required field: title')
  if (!data.description) errors.push('Missing required field: description')
  if (!Array.isArray(data.competencies)) errors.push('Missing or invalid competencies array')
  if (!Array.isArray(data.stages)) errors.push('Missing or invalid stages array')
  
  // Validate stages
  if (Array.isArray(data.stages)) {
    data.stages.forEach((stage: any, index: number) => {
      if (!stage.stageId) errors.push(`Stage ${index}: Missing stageId`)
      if (!stage.challengeType) errors.push(`Stage ${index}: Missing challengeType`)
      if (!stage.challengeData) errors.push(`Stage ${index}: Missing challengeData`)
    })
  }
  
  // Validate caseFiles
  if (data.caseFiles && !Array.isArray(data.caseFiles)) {
    errors.push('caseFiles must be an array')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate article frontmatter against Prisma schema
 */
function validateArticleFrontmatter(frontmatter: ArticleFrontmatter): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!frontmatter.title || frontmatter.title.trim().length === 0) {
    errors.push('Title is required')
  }
  
  if (!frontmatter.competency || frontmatter.competency.trim().length === 0) {
    errors.push('Competency ID is required')
  }
  
  if (frontmatter.status && !['draft', 'in_review', 'approved', 'published'].includes(frontmatter.status)) {
    errors.push(`Invalid status: ${frontmatter.status}. Must be one of: draft, in_review, approved, published`)
  }
  
  if (frontmatter.year && (frontmatter.year < 1 || frontmatter.year > 5)) {
    errors.push(`Invalid year: ${frontmatter.year}. Must be between 1 and 5`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

async function importCases() {
  console.log('\n🎯 Importing cases from markdown files and JSON files...\n')

  const casesDir = path.join(process.cwd(), 'content', 'cases')
  const jsonCasesDir = path.join(process.cwd(), 'data', 'case-studies')
  
  const caseFiles: string[] = []
  const jsonCaseFiles: string[] = []
  
  // Recursively find all .md files in cases directory
  if (fs.existsSync(casesDir)) {
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
  }
  
  // Find all .json files in data/case-studies directory
  if (fs.existsSync(jsonCasesDir)) {
    const files = fs.readdirSync(jsonCasesDir)
    for (const file of files) {
      if (file.endsWith('.json')) {
        jsonCaseFiles.push(path.join(jsonCasesDir, file))
      }
    }
  }
  
  console.log(`Found ${caseFiles.length} markdown case files`)
  console.log(`Found ${jsonCaseFiles.length} JSON case files\n`)

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

  // Process JSON case files
  for (const filePath of jsonCaseFiles) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const caseData = JSON.parse(fileContent)

      // Validate JSON structure
      const validation = validateCaseStudyJSON(caseData)
      if (!validation.valid) {
        console.log(`⚠️  Skipping ${path.basename(filePath)}: Validation errors:`)
        validation.errors.forEach(err => console.log(`   - ${err}`))
        errors++
        continue
      }

      // Generate storage path
      const storagePath = `cases/${path.basename(filePath)}`

      // Check if case exists by storage_path
      const { data: existing } = await supabase
        .from('cases')
        .select('id')
        .eq('storage_path', storagePath)
        .single()

      const casePayload = {
        title: caseData.title,
        description: caseData.description || '',
        briefing_doc: JSON.stringify(caseData), // Store full JSON as briefing_doc
        status: 'published' as const,
        difficulty: (caseData.difficulty || 'intermediate').toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
        estimated_minutes: caseData.estimatedDuration || 120,
        storage_path: storagePath,
        metadata: {
          version: caseData.version,
          caseId: caseData.caseId,
          competencies: caseData.competencies,
          stages: caseData.stages?.length || 0,
        },
        rubric: caseData.rubric || {},
      }

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('cases')
          .update({
            ...casePayload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) {
          console.log(`❌ Error updating ${caseData.title}: ${error.message}`)
          errors++
        } else {
          console.log(`✅ Updated: ${caseData.title}`)
          updated++
        }
      } else {
        // Insert new
        const { data: newCase, error } = await supabase
          .from('cases')
          .insert(casePayload)
          .select('id')
          .single()

        if (error) {
          console.log(`❌ Error creating ${caseData.title}: ${error.message}`)
          errors++
        } else {
          console.log(`✨ Created: ${caseData.title}`)
          imported++

          // Link competencies if provided (assuming competency names map to IDs)
          if (newCase && caseData.competencies && Array.isArray(caseData.competencies)) {
            // Note: In practice, would need to resolve competency names to IDs
            console.log(`   Note: Competencies found: ${caseData.competencies.join(', ')}`)
            console.log(`   Manual competency linking may be required`)
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

