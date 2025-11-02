/**
 * Script to import learning paths from JSON files to database
 * Run with: npx tsx scripts/import-learning-paths.ts
 */

import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma/server'

interface LearningPathItem {
  type: 'lesson' | 'case'
  domain: string
  module?: string
  lesson?: string
  caseId?: string
}

interface LearningPathJSON {
  id: string
  title: string
  description?: string
  duration: string
  items: LearningPathItem[]
}

async function importLearningPaths() {
  const pathsDir = path.join(process.cwd(), 'content', 'paths')
  
  if (!fs.existsSync(pathsDir)) {
    console.error('Paths directory not found:', pathsDir)
    process.exit(1)
  }

  const files = fs.readdirSync(pathsDir).filter(f => f.endsWith('.json'))
  console.log(`Found ${files.length} learning path files to import`)

  for (const file of files) {
    try {
      const filePath = path.join(pathsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const pathData: LearningPathJSON = JSON.parse(content)

      console.log(`\nImporting: ${pathData.title} (${pathData.id})`)

      // Check if path already exists
      const existing = await prisma.learningPath.findUnique({
        where: { slug: pathData.id },
      })

      if (existing) {
        console.log(`  ✓ Already exists, skipping`)
        continue
      }

      // Create path with items
      const created = await prisma.learningPath.create({
        data: {
          slug: pathData.id,
          title: pathData.title,
          description: pathData.description || null,
          duration: pathData.duration,
          status: 'published',
          items: {
            create: pathData.items.map((item, index) => ({
              order: index,
              type: item.type,
              domain: item.domain || null,
              module: item.module || null,
              lesson: item.lesson || null,
              caseId: item.caseId || null,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      console.log(`  ✓ Created with ${created.items.length} items`)
    } catch (error) {
      console.error(`  ✗ Error importing ${file}:`, error)
    }
  }

  console.log('\n✓ Import complete!')
}

importLearningPaths()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Import failed:', error)
    process.exit(1)
  })

