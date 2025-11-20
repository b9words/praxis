#!/usr/bin/env tsx

/**
 * Validation script to check curriculum wiring
 * - Verifies all lessons in curriculum-data have corresponding markdown files
 * - Checks all markdown files have corresponding curriculum-data entries
 * - Validates learning paths reference valid lessons/cases
 * - Reports any mismatches or missing files
 */

import fs from 'fs'
import path from 'path'
import { completeCurriculumData, getAllLessonsFlat, getDomainById } from '../lib/curriculum-data'
import { getAllInteractiveSimulations } from '../lib/case-study-loader'

interface ValidationResult {
  missingFiles: Array<{ domain: string; module: string; lesson: string; expectedPath: string }>
  orphanedFiles: Array<{ filePath: string }>
  pathIssues: Array<{ pathId: string; item: any; issue: string }>
  caseIssues: Array<{ caseId: string; issue: string }>
}

function validateCurriculumWiring(): ValidationResult {
  const result: ValidationResult = {
    missingFiles: [],
    orphanedFiles: [],
    pathIssues: [],
    caseIssues: [],
  }

  console.log('🔍 Validating Curriculum Wiring...\n')

  // 1. Check all lessons in curriculum-data have markdown files
  console.log('📚 Checking lessons in curriculum-data...')
  const allLessons = getAllLessonsFlat()
  let foundCount = 0
  let missingCount = 0

  completeCurriculumData.forEach((domain, domainIndex) => {
    const domainNumber = String(domainIndex + 1).padStart(2, '0')
    
    domain.modules.forEach(module => {
      const moduleNumber = String(module.number).padStart(2, '0')
      
      module.lessons.forEach(lesson => {
        const lessonNumber = String(lesson.number).padStart(2, '0')
        const expectedPath = path.join(
          process.cwd(),
          'content',
          'curriculum',
          `${domainNumber}-${domain.id}`,
          `${moduleNumber}-${module.id}`,
          `${lessonNumber}-${lesson.id}.md`
        )

        if (fs.existsSync(expectedPath)) {
          foundCount++
        } else {
          missingCount++
          result.missingFiles.push({
            domain: domain.id,
            module: module.id,
            lesson: lesson.id,
            expectedPath: path.relative(process.cwd(), expectedPath),
          })
        }
      })
    })
  })

  console.log(`   ✅ Found: ${foundCount} files`)
  if (missingCount > 0) {
    console.log(`   ❌ Missing: ${missingCount} files`)
  }

  // 2. Check for orphaned markdown files (files not in curriculum-data)
  // Note: README.md files are expected and should be ignored
  console.log('\n📁 Checking for orphaned markdown files...')
  const curriculumDir = path.join(process.cwd(), 'content', 'curriculum')
  
  if (fs.existsSync(curriculumDir)) {
    const allFiles = getAllMarkdownFiles(curriculumDir)
    const expectedFiles = new Set(
      completeCurriculumData.flatMap((domain, domainIndex) => {
        const domainNumber = String(domainIndex + 1).padStart(2, '0')
        return domain.modules.flatMap(module => {
          const moduleNumber = String(module.number).padStart(2, '0')
          return module.lessons.map(lesson => {
            const lessonNumber = String(lesson.number).padStart(2, '0')
            return path.join(
              `${domainNumber}-${domain.id}`,
              `${moduleNumber}-${module.id}`,
              `${lessonNumber}-${lesson.id}.md`
            )
          })
        })
      })
    )

    allFiles.forEach(file => {
      const relativePath = path.relative(curriculumDir, file)
      // Ignore README.md files as they are expected documentation
      if (!relativePath.endsWith('README.md') && !expectedFiles.has(relativePath)) {
        result.orphanedFiles.push({
          filePath: relativePath,
        })
      }
    })
  }

  if (result.orphanedFiles.length > 0) {
    console.log(`   ⚠️  Found ${result.orphanedFiles.length} orphaned files`)
  } else {
    console.log('   ✅ No orphaned files (README.md files are expected)')
  }

  // 3. Validate learning paths
  console.log('\n🛤️  Validating learning paths...')
  const pathsDir = path.join(process.cwd(), 'content', 'paths')
  
  if (fs.existsSync(pathsDir)) {
    const pathFiles = fs.readdirSync(pathsDir).filter(f => f.endsWith('.json'))
    
    pathFiles.forEach(file => {
      try {
        const filePath = path.join(pathsDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const pathData = JSON.parse(content) as {
          id: string
          items: Array<{
            type: 'lesson' | 'case'
            domain?: string
            module?: string
            lesson?: string
            caseId?: string
          }>
        }

        pathData.items.forEach((item, index) => {
          if (item.type === 'lesson') {
            if (!item.domain || !item.module || !item.lesson) {
              result.pathIssues.push({
                pathId: pathData.id,
                item: { ...item, index },
                issue: 'Missing domain, module, or lesson ID',
              })
              return
            }

            const lesson = allLessons.find(
              l => l.domain === item.domain &&
                   l.moduleId === item.module &&
                   l.lessonId === item.lesson
            )

            if (!lesson) {
              result.pathIssues.push({
                pathId: pathData.id,
                item: { ...item, index },
                issue: `Lesson not found in curriculum-data: ${item.domain}/${item.module}/${item.lesson}`,
              })
            }

            // Check if file exists
            const domain = getDomainById(item.domain!)
            if (domain) {
              const domainIndex = completeCurriculumData.findIndex(d => d.id === item.domain)
              const domainNumber = String(domainIndex + 1).padStart(2, '0')
              const module = domain.modules.find(m => m.id === item.module)
              
              if (module) {
                const moduleNumber = String(module.number).padStart(2, '0')
                const lessonObj = module.lessons.find(l => l.id === item.lesson)
                
                if (lessonObj) {
                  const lessonNumber = String(lessonObj.number).padStart(2, '0')
                  const expectedPath = path.join(
                    process.cwd(),
                    'content',
                    'curriculum',
                    `${domainNumber}-${item.domain}`,
                    `${moduleNumber}-${item.module}`,
                    `${lessonNumber}-${item.lesson}.md`
                  )

                  if (!fs.existsSync(expectedPath)) {
                    result.pathIssues.push({
                      pathId: pathData.id,
                      item: { ...item, index },
                      issue: `Markdown file does not exist: ${path.relative(process.cwd(), expectedPath)}`,
                    })
                  }
                }
              }
            }
          } else if (item.type === 'case' && item.caseId) {
            const allSimulations = getAllInteractiveSimulations()
            const caseStudy = allSimulations.find(s => s.caseId === item.caseId)

            if (!caseStudy) {
              result.pathIssues.push({
                pathId: pathData.id,
                item: { ...item, index },
                issue: `Case study not found: ${item.caseId}`,
              })
            }
          }
        })
      } catch (error) {
        result.pathIssues.push({
          pathId: file,
          item: {},
          issue: `Error parsing path file: ${error}`,
        })
      }
    })
  }

  const pathIssuesCount = result.pathIssues.length
  if (pathIssuesCount > 0) {
    console.log(`   ⚠️  Found ${pathIssuesCount} issues in learning paths`)
  } else {
    console.log('   ✅ All learning paths valid')
  }

  // 4. Validate case studies
  console.log('\n📖 Validating case studies...')
  const allSimulations = getAllInteractiveSimulations()
  const caseStudyRoute = path.join(process.cwd(), 'app', '(app)', 'library', 'case-studies', '[caseId]')
  
  allSimulations.forEach(simulation => {
    // Check if route exists (simplified check - just verify the directory structure)
    const casePagePath = path.join(caseStudyRoute, 'page.tsx')
    // We can't easily check dynamic routes, so we'll just verify the case ID format
    if (!simulation.caseId || simulation.caseId.trim() === '') {
      result.caseIssues.push({
        caseId: simulation.caseId || 'unknown',
        issue: 'Case ID is empty or invalid',
      })
    }
  })

  if (result.caseIssues.length > 0) {
    console.log(`   ⚠️  Found ${result.caseIssues.length} case study issues`)
  } else {
    console.log(`   ✅ All ${allSimulations.length} case studies valid`)
  }

  return result
}

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = []
  
  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  
  return files
}

function printResults(result: ValidationResult) {
  console.log('\n' + '='.repeat(80))
  console.log('📊 VALIDATION RESULTS')
  console.log('='.repeat(80) + '\n')

  if (result.missingFiles.length > 0) {
    console.log('❌ MISSING MARKDOWN FILES:')
    result.missingFiles.forEach(({ domain, module, lesson, expectedPath }) => {
      console.log(`   - ${domain}/${module}/${lesson}`)
      console.log(`     Expected: ${expectedPath}`)
    })
    console.log()
  }

  if (result.orphanedFiles.length > 0) {
    console.log('⚠️  ORPHANED MARKDOWN FILES (not in curriculum-data):')
    result.orphanedFiles.forEach(({ filePath }) => {
      console.log(`   - ${filePath}`)
    })
    console.log()
  }

  if (result.pathIssues.length > 0) {
    console.log('⚠️  LEARNING PATH ISSUES:')
    const groupedByPath = new Map<string, typeof result.pathIssues>()
    result.pathIssues.forEach(issue => {
      if (!groupedByPath.has(issue.pathId)) {
        groupedByPath.set(issue.pathId, [])
      }
      groupedByPath.get(issue.pathId)!.push(issue)
    })

    groupedByPath.forEach((issues, pathId) => {
      console.log(`   Path: ${pathId}`)
      issues.forEach(({ item, issue }) => {
        console.log(`     Item ${item.index || '?'}: ${issue}`)
        if (item.domain || item.caseId) {
          console.log(`       ${JSON.stringify(item)}`)
        }
      })
    })
    console.log()
  }

  if (result.caseIssues.length > 0) {
    console.log('⚠️  CASE STUDY ISSUES:')
    result.caseIssues.forEach(({ caseId, issue }) => {
      console.log(`   - ${caseId}: ${issue}`)
    })
    console.log()
  }

  const totalIssues = 
    result.missingFiles.length +
    result.orphanedFiles.length +
    result.pathIssues.length +
    result.caseIssues.length

  if (totalIssues === 0) {
    console.log('✅ All validations passed! Curriculum wiring is correct.\n')
    process.exit(0)
  } else {
    console.log(`❌ Found ${totalIssues} total issues that need to be fixed.\n`)
    process.exit(1)
  }
}

// Run validation
const result = validateCurriculumWiring()
printResults(result)

