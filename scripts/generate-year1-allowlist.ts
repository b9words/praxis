import * as fs from 'fs'
import * as path from 'path'
import { getAllLessonsFlat } from '../lib/curriculum-data'

// Year 1 domains from recommendation engine
const year1Domains = [
  'capital-allocation',
  'second-order-decision-making',
  'competitive-moat-architecture'
]

// Get all lessons and filter for Year 1
const allLessons = getAllLessonsFlat()
const year1Lessons = allLessons
  .filter(lesson => year1Domains.includes(lesson.domain))
  .map(lesson => `${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`)

// Read article IDs from SQL files
const sqlFiles = [
  'content/year1_articles.sql',
  'content/year1_articles_part2.sql',
  'content/year1_domain1_2.sql',
  'content/year1_domain1_3.sql',
  'content/year1_domain1_4.sql'
]

const articleIds = new Set<string>()

sqlFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    // Extract article IDs (format: 'y1-a01-...')
    const articleMatches = content.matchAll(/'y1-a\d{2}-[^']+'/g)
    for (const match of articleMatches) {
      articleIds.add(match[0].replace(/'/g, ''))
    }
  }
})

// Read case studies - for now, we'll include all and filter later based on metadata
const caseStudyDir = path.join(process.cwd(), 'data/case-studies')
const caseStudySlugs: string[] = []

if (fs.existsSync(caseStudyDir)) {
  const files = fs.readdirSync(caseStudyDir).filter(f => f.endsWith('.json'))
  files.forEach(file => {
    try {
      const content = JSON.parse(
        fs.readFileSync(path.join(caseStudyDir, file), 'utf8')
      )
      const caseId = content.caseId || content.id || file.replace('.json', '')
      // For now, include all case studies - we can filter by metadata later
      caseStudySlugs.push(caseId)
    } catch (e) {
      console.error('Error reading case study:', file, e)
    }
  })
}

// Generate allowlist
const allowlist = {
  articleSlugs: Array.from(articleIds).sort(),
  lessonSlugs: year1Lessons.sort(),
  caseStudySlugs: caseStudySlugs.sort()
}

// Write to file
const outputPath = path.join(process.cwd(), 'content/year1-slugs.json')
fs.writeFileSync(outputPath, JSON.stringify(allowlist, null, 2))

console.log('Generated year1-slugs.json:')
console.log(`- ${allowlist.articleSlugs.length} articles`)
console.log(`- ${allowlist.lessonSlugs.length} lessons`)
console.log(`- ${allowlist.caseStudySlugs.length} case studies`)





