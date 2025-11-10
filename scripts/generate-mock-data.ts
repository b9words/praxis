#!/usr/bin/env tsx

/**
 * Generate comprehensive mock data for testing the platform
 * 
 * Usage:
 *   tsx scripts/generate-mock-data.ts                    # Generate all mock data
 *   tsx scripts/generate-mock-data.ts --lessons-only    # Only generate lessons
 *   tsx scripts/generate-mock-data.ts --cases-only     # Only generate case studies
 *   tsx scripts/generate-mock-data.ts --progress-only  # Only generate user progress
 */

import fs from 'fs'
import path from 'path'
import { faker } from '@faker-js/faker'
import { completeCurriculumData, getAllLessonsFlat } from '../lib/curriculum-data'
import { prisma } from '../lib/prisma/server'

// Set seed for reproducible results
faker.seed(42)

interface GenerateOptions {
  lessonsOnly?: boolean
  casesOnly?: boolean
  progressOnly?: boolean
  numCases?: number
  numUsers?: number
}

const LESSON_TEMPLATE = `---
title: "{title}"
domain: "{domain}"
module: "{module}"
lesson_number: {lessonNumber}
module_number: {moduleNumber}
description: "{description}"
status: "published"
estimated_reading_time: {readingTime}
created_at: "{createdAt}"
updated_at: "{updatedAt}"
tags: ["{domainId}", "{moduleId}", "executive-education", "mock-data"]
competency_level: "advanced"
---

# {title}

## Executive Summary

{executiveSummary}

**Key Learning Objectives:**
{learningObjectives}

---

## Core Principle

{corePrinciple}

### The Foundational Framework

{foundationalFramework}

### Why This Matters for CEOs

{whyMatters}

---

## The Framework

{framework}

### Decision Matrix

| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| **Risk Level** | {riskA} | {riskB} | {riskC} |
| **Time Horizon** | {timeA} | {timeB} | {timeC} |
| **Resource Requirements** | {resourceA} | {resourceB} | {resourceC} |
| **Expected ROI** | {roiA} | {roiB} | {roiC} |

### Implementation Process

\`\`\`mermaid
flowchart TD
    A[Assess Current State] --> B{Strategic Fit?}
    B -->|Yes| C[Develop Implementation Plan]
    B -->|No| D[Explore Alternatives]
    C --> E[Execute Phase 1]
    E --> F[Monitor & Adjust]
    F --> G[Scale Success]
    D --> H[Reassess Strategy]
\`\`\`

---

## Real-World Examples

{realWorldExamples}

### Case Study 1: {company1}
**Situation:** {situation1}
**Action:** {action1}
**Result:** {result1}
**Lesson:** {lesson1}

### Case Study 2: {company2}
**Situation:** {situation2}
**Action:** {action2}
**Result:** {result2}
**Lesson:** {lesson2}

---

## Common Pitfalls

{commonPitfalls}

### The Top 5 Mistakes

1. **{mistake1}** - {mistake1Desc}
2. **{mistake2}** - {mistake2Desc}
3. **{mistake3}** - {mistake3Desc}
4. **{mistake4}** - {mistake4Desc}
5. **{mistake5}** - {mistake5Desc}

---

## Application Exercise

{applicationExercise}

### Scenario

{scenario}

### Your Task

{task}

### Reflection Questions

1. {reflection1}
2. {reflection2}
3. {reflection3}

---

## Key Takeaways

{keyTakeaways}

1. {takeaway1}
2. {takeaway2}
3. {takeaway3}
4. {takeaway4}
5. {takeaway5}
`

function generateLessonContent(lesson: any, domain: any, module: any): string {
  const company1 = faker.company.name()
  const company2 = faker.company.name()
  
  return LESSON_TEMPLATE
    .replace(/{title}/g, `${module.number}.${lesson.number}: ${lesson.title}`)
    .replace(/{domain}/g, domain.title)
    .replace(/{module}/g, module.title)
    .replace(/{lessonNumber}/g, lesson.number.toString())
    .replace(/{moduleNumber}/g, module.number.toString())
    .replace(/{description}/g, lesson.description)
    .replace(/{domainId}/g, domain.id)
    .replace(/{moduleId}/g, module.id)
    .replace(/{readingTime}/g, faker.number.int({ min: 10, max: 20 }).toString())
    .replace(/{createdAt}/g, new Date().toISOString())
    .replace(/{updatedAt}/g, new Date().toISOString())
    .replace(/{executiveSummary}/g, faker.lorem.paragraphs(2))
    .replace(/{learningObjectives}/g, [
      `- ${faker.lorem.sentence()}`,
      `- ${faker.lorem.sentence()}`,
      `- ${faker.lorem.sentence()}`,
      `- ${faker.lorem.sentence()}`
    ].join('\n'))
    .replace(/{corePrinciple}/g, faker.lorem.paragraphs(3))
    .replace(/{foundationalFramework}/g, faker.lorem.paragraphs(2))
    .replace(/{whyMatters}/g, faker.lorem.paragraphs(2))
    .replace(/{framework}/g, faker.lorem.paragraphs(4))
    .replace(/{riskA}/g, faker.helpers.arrayElement(['Low', 'Medium', 'High']))
    .replace(/{riskB}/g, faker.helpers.arrayElement(['Low', 'Medium', 'High']))
    .replace(/{riskC}/g, faker.helpers.arrayElement(['Low', 'Medium', 'High']))
    .replace(/{timeA}/g, faker.helpers.arrayElement(['1-2 years', '3-5 years', '5+ years']))
    .replace(/{timeB}/g, faker.helpers.arrayElement(['1-2 years', '3-5 years', '5+ years']))
    .replace(/{timeC}/g, faker.helpers.arrayElement(['1-2 years', '3-5 years', '5+ years']))
    .replace(/{resourceA}/g, faker.helpers.arrayElement(['Minimal', 'Moderate', 'Significant']))
    .replace(/{resourceB}/g, faker.helpers.arrayElement(['Minimal', 'Moderate', 'Significant']))
    .replace(/{resourceC}/g, faker.helpers.arrayElement(['Minimal', 'Moderate', 'Significant']))
    .replace(/{roiA}/g, `${faker.number.int({ min: 10, max: 20 })}-${faker.number.int({ min: 20, max: 30 })}%`)
    .replace(/{roiB}/g, `${faker.number.int({ min: 25, max: 35 })}-${faker.number.int({ min: 35, max: 45 })}%`)
    .replace(/{roiC}/g, `${faker.number.int({ min: 40, max: 50 })}%+`)
    .replace(/{realWorldExamples}/g, faker.lorem.paragraphs(3))
    .replace(/{company1}/g, company1)
    .replace(/{situation1}/g, faker.lorem.paragraph())
    .replace(/{action1}/g, faker.lorem.paragraph())
    .replace(/{result1}/g, faker.lorem.paragraph())
    .replace(/{lesson1}/g, faker.lorem.sentence())
    .replace(/{company2}/g, company2)
    .replace(/{situation2}/g, faker.lorem.paragraph())
    .replace(/{action2}/g, faker.lorem.paragraph())
    .replace(/{result2}/g, faker.lorem.paragraph())
    .replace(/{lesson2}/g, faker.lorem.sentence())
    .replace(/{commonPitfalls}/g, faker.lorem.paragraphs(2))
    .replace(/{mistake1}/g, faker.lorem.words(3))
    .replace(/{mistake1Desc}/g, faker.lorem.sentence())
    .replace(/{mistake2}/g, faker.lorem.words(3))
    .replace(/{mistake2Desc}/g, faker.lorem.sentence())
    .replace(/{mistake3}/g, faker.lorem.words(3))
    .replace(/{mistake3Desc}/g, faker.lorem.sentence())
    .replace(/{mistake4}/g, faker.lorem.words(3))
    .replace(/{mistake4Desc}/g, faker.lorem.sentence())
    .replace(/{mistake5}/g, faker.lorem.words(3))
    .replace(/{mistake5Desc}/g, faker.lorem.sentence())
    .replace(/{applicationExercise}/g, faker.lorem.paragraphs(2))
    .replace(/{scenario}/g, faker.lorem.paragraphs(2))
    .replace(/{task}/g, faker.lorem.paragraph())
    .replace(/{reflection1}/g, faker.lorem.sentence())
    .replace(/{reflection2}/g, faker.lorem.sentence())
    .replace(/{reflection3}/g, faker.lorem.sentence())
    .replace(/{keyTakeaways}/g, faker.lorem.paragraph())
    .replace(/{takeaway1}/g, faker.lorem.sentence())
    .replace(/{takeaway2}/g, faker.lorem.sentence())
    .replace(/{takeaway3}/g, faker.lorem.sentence())
    .replace(/{takeaway4}/g, faker.lorem.sentence())
    .replace(/{takeaway5}/g, faker.lorem.sentence())
}

async function generateMockLessons() {
  console.log('📚 Generating mock lessons...\n')
  
  const baseDir = path.join(process.cwd(), 'content', 'curriculum')
  let generated = 0
  let skipped = 0

  for (const domain of completeCurriculumData) {
    for (const module of domain.modules) {
      for (const lesson of module.lessons) {
        const lessonDir = path.join(baseDir, domain.id, module.id)
        const lessonPath = path.join(lessonDir, `${lesson.id}.md`)

        // Skip if already exists
        if (fs.existsSync(lessonPath)) {
          skipped++
          continue
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(lessonDir)) {
          fs.mkdirSync(lessonDir, { recursive: true })
        }

        // Generate content
        const content = generateLessonContent(lesson, domain, module)
        fs.writeFileSync(lessonPath, content)
        generated++

        if (generated % 10 === 0) {
          process.stdout.write(`  Generated ${generated} lessons...\r`)
        }
      }
    }
  }

  console.log(`\n✅ Generated ${generated} lessons, skipped ${skipped} existing\n`)
}

function generateMockCaseStudy(index: number) {
  const caseId = `cs_mock_${faker.string.alphanumeric(8).toLowerCase()}`
  const competencies = faker.helpers.arrayElements([
    'Operations Management',
    'Crisis Leadership',
    'Capital Efficiency',
    'Strategic Thinking',
    'Organizational Design',
    'Market Foresight',
    'Stakeholder Communication',
    'Risk Management'
  ], { min: 2, max: 4 })

  const caseStudy = {
    caseId,
    version: '1.0',
    title: `${faker.company.name()}: ${faker.company.catchPhrase()} (${faker.date.past({ years: 5 }).getFullYear()})`,
    description: faker.lorem.paragraphs(2),
    competencies,
    estimatedDuration: faker.number.int({ min: 60, max: 120 }),
    difficulty: faker.helpers.arrayElement(['intermediate', 'advanced']),
    caseFiles: [
      {
        fileId: `${caseId}_data`,
        fileName: `${faker.company.name()} Financial Metrics ${faker.date.past({ years: 5 }).getFullYear()}.csv`,
        fileType: 'FINANCIAL_DATA',
        source: {
          type: 'STATIC',
          content: `Metric,Q1,Q2,Q3,Q4\nRevenue,${faker.number.int({ min: 100, max: 1000 })},${faker.number.int({ min: 100, max: 1000 })},${faker.number.int({ min: 100, max: 1000 })},${faker.number.int({ min: 100, max: 1000 })}\nProfit Margin,${faker.number.float({ min: 5, max: 30, fractionDigits: 1 })}%,${faker.number.float({ min: 5, max: 30, fractionDigits: 1 })}%,${faker.number.float({ min: 5, max: 30, fractionDigits: 1 })}%,${faker.number.float({ min: 5, max: 30, fractionDigits: 1 })}%`
        }
      },
      {
        fileId: `${caseId}_memo`,
        fileName: `URGENT: ${faker.lorem.words(3)}.md`,
        fileType: 'MEMO',
        source: {
          type: 'STATIC',
          content: `# URGENT MEMO\n\n**From:** ${faker.person.jobTitle()}\n**To:** CEO\n**Date:** ${faker.date.past({ years: 2 }).toISOString().split('T')[0]}\n**Subject:** ${faker.lorem.sentence()}\n\n## Current Situation\n\n${faker.lorem.paragraphs(3)}\n\n### Primary Challenges:\n\n1. ${faker.lorem.sentence()}\n2. ${faker.lorem.sentence()}\n3. ${faker.lorem.sentence()}\n\n### Strategic Options:\n\n**Option A:** ${faker.lorem.sentence()}\n**Option B:** ${faker.lorem.sentence()}\n**Option C:** ${faker.lorem.sentence()}\n\n### Recommendation:\n\n${faker.lorem.paragraph()}`
        }
      }
    ],
    stages: [
      {
        stageId: `${caseId}_strategy`,
        title: 'Strategic Decision',
        description: faker.lorem.sentence(),
        challengeType: 'STRATEGIC_OPTIONS',
        challengeData: {
          prompt: faker.lorem.paragraph(),
          options: [
            {
              id: 'option_a',
              title: faker.lorem.words(3),
              description: faker.lorem.paragraph()
            },
            {
              id: 'option_b',
              title: faker.lorem.words(3),
              description: faker.lorem.paragraph()
            },
            {
              id: 'option_c',
              title: faker.lorem.words(3),
              description: faker.lorem.paragraph()
            }
          ]
        }
      },
      {
        stageId: `${caseId}_communication`,
        title: 'Communication Strategy',
        description: faker.lorem.sentence(),
        challengeType: 'WRITTEN_ANALYSIS',
        challengeData: {
          prompt: faker.lorem.paragraph(),
          wordLimit: faker.number.int({ min: 500, max: 1000 }),
          keyPoints: [
            faker.lorem.sentence(),
            faker.lorem.sentence(),
            faker.lorem.sentence()
          ]
        }
      }
    ]
  }

  return caseStudy
}

async function generateMockCaseStudies(numCases: number = 20) {
  console.log(`📋 Generating ${numCases} mock case studies...\n`)
  
  const casesDir = path.join(process.cwd(), 'data', 'case-studies')
  if (!fs.existsSync(casesDir)) {
    fs.mkdirSync(casesDir, { recursive: true })
  }

  let generated = 0
  let skipped = 0

  for (let i = 0; i < numCases; i++) {
    const caseStudy = generateMockCaseStudy(i)
    const casePath = path.join(casesDir, `${caseStudy.caseId}.json`)

    if (fs.existsSync(casePath)) {
      skipped++
      continue
    }

    fs.writeFileSync(casePath, JSON.stringify(caseStudy, null, 2))
    generated++

    if ((i + 1) % 5 === 0) {
      process.stdout.write(`  Generated ${generated} case studies...\r`)
    }
  }

  console.log(`\n✅ Generated ${generated} case studies, skipped ${skipped} existing\n`)
}

async function generateMockUserProgress(numUsers: number = 5) {
  console.log(`👥 Generating mock user progress for ${numUsers} users...\n`)

  try {
    // Get all lessons
    const allLessons = getAllLessonsFlat()
    
    // Get existing users or use first user as test
    const existingUsers = await prisma.profile.findMany({
      take: numUsers
    })

    if (existingUsers.length === 0) {
      console.log('⚠️  No users found in database. Skipping user progress generation.')
      console.log('   Tip: Create users first through the app, then run this script.\n')
      return
    }

    const users = existingUsers.slice(0, numUsers)
    console.log(`   Using ${users.length} existing user(s) for progress generation...\n`)

    // Generate progress for each user
    for (const user of users) {
      const lessonsToComplete = faker.helpers.arrayElements(
        allLessons,
        { min: 10, max: Math.min(50, allLessons.length) }
      )

      for (const lesson of lessonsToComplete) {
        const status = faker.helpers.arrayElement(['completed', 'in_progress', 'not_started'])
        const progressPercentage = status === 'completed' 
          ? 100 
          : status === 'in_progress' 
          ? faker.number.int({ min: 10, max: 90 })
          : 0

        await prisma.userLessonProgress.upsert({
          where: {
            userId_domainId_moduleId_lessonId: {
              userId: user.id,
              domainId: lesson.domain,
              moduleId: lesson.moduleId,
              lessonId: lesson.lessonId
            }
          },
          update: {
            status,
            progressPercentage,
            timeSpentSeconds: faker.number.int({ min: 300, max: 3600 }),
            completedAt: status === 'completed' ? faker.date.past({ years: 1 }) : null
          },
          create: {
            userId: user.id,
            domainId: lesson.domain,
            moduleId: lesson.moduleId,
            lessonId: lesson.lessonId,
            status,
            progressPercentage,
            timeSpentSeconds: faker.number.int({ min: 300, max: 3600 }),
            completedAt: status === 'completed' ? faker.date.past({ years: 1 }) : null
          }
        })
      }
    }

    console.log(`✅ Generated progress for ${users.length} users\n`)
  } catch (error) {
    console.error('❌ Error generating user progress:', error)
    console.log('⚠️  Skipping user progress generation (database may not be available)\n')
  }
}

async function main() {
  const args = process.argv.slice(2)
  const options: GenerateOptions = {
    lessonsOnly: args.includes('--lessons-only'),
    casesOnly: args.includes('--cases-only'),
    progressOnly: args.includes('--progress-only'),
    numCases: args.includes('--num-cases') 
      ? parseInt(args[args.indexOf('--num-cases') + 1]) || 20
      : 20,
    numUsers: args.includes('--num-users')
      ? parseInt(args[args.indexOf('--num-users') + 1]) || 5
      : 5
  }

  console.log('🚀 Starting mock data generation...\n')

  try {
    if (!options.casesOnly && !options.progressOnly) {
      await generateMockLessons()
    }

    if (!options.lessonsOnly && !options.progressOnly) {
      await generateMockCaseStudies(options.numCases)
    }

    if (!options.lessonsOnly && !options.casesOnly) {
      await generateMockUserProgress(options.numUsers)
    }

    console.log('✨ Mock data generation complete!\n')
  } catch (error) {
    console.error('❌ Error during mock data generation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

