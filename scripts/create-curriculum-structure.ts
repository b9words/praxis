#!/usr/bin/env tsx

import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { completeCurriculumData, generateContentPaths } from '../lib/curriculum-data'

async function createCurriculumStructure() {
  console.log('🏗️  Creating Production-Ready Curriculum Structure...\n')

  const contentPaths = generateContentPaths()
  const baseDir = process.cwd()
  
  // Create directory structure
  console.log('📁 Creating directory structure...')
  const directories = new Set<string>()
  
  contentPaths.forEach(path => {
    const dir = dirname(join(baseDir, path.filePath))
    directories.add(dir)
  })

  for (const dir of directories) {
    try {
      await mkdir(dir, { recursive: true })
      console.log(`   ✅ Created: ${dir.replace(baseDir, '.')}/`)
    } catch (error) {
      console.log(`   ⚠️  Directory exists: ${dir.replace(baseDir, '.')}/`)
    }
  }

  console.log(`\n📄 Creating ${contentPaths.length} lesson template files...`)
  
  // Create template files for each lesson
  let created = 0
  let skipped = 0

  for (const path of contentPaths) {
    const fullPath = join(baseDir, path.filePath)
    
    // Find the lesson data
    const domain = completeCurriculumData.find(d => d.id === path.domain)!
    const module = domain.modules.find(m => m.id === path.module)!
    const lesson = module.lessons.find(l => l.id === path.lesson)!

    const template = `---
title: "${path.title}"
domain: "${domain.title}"
module: "${module.title}"
lesson_number: ${lesson.number}
module_number: ${module.number}
description: "${lesson.description}"
status: "draft"
estimated_reading_time: 12
created_at: "${new Date().toISOString()}"
updated_at: "${new Date().toISOString()}"
tags: ["${domain.id}", "${module.id}", "executive-education"]
competency_level: "advanced"
---

# ${path.title}

## Executive Summary

*[2-3 paragraphs providing a high-level overview of the lesson's key concepts and why they matter for CEOs]*

**Key Learning Objectives:**
- Understand the fundamental principles of [topic]
- Learn to apply [framework/tool] in real-world scenarios
- Develop the ability to [specific skill/capability]
- Master the art of [advanced technique]

---

## Core Principle

*[400-600 words explaining the fundamental concept, theoretical foundation, and industry context]*

### The Foundational Framework

*[Detailed explanation of the core framework or methodology]*

### Why This Matters for CEOs

*[Specific relevance to executive decision-making and leadership]*

---

## The Framework

*[600-800 words providing step-by-step methodology, decision criteria, and implementation process]*

### Decision Matrix

| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| **Risk Level** | Low | Medium | High |
| **Time Horizon** | 1-2 years | 3-5 years | 5+ years |
| **Resource Requirements** | Minimal | Moderate | Significant |
| **Expected ROI** | 15-20% | 25-35% | 40%+ |

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

*[500-700 words with 2-3 detailed company case studies, specific numbers and outcomes, lessons learned]*

### Case Study 1: [Company Name]
**Situation:** *[Brief context]*
**Action:** *[What they did]*
**Result:** *[Specific outcomes with numbers]*
**Lesson:** *[Key takeaway]*

### Case Study 2: [Company Name]
**Situation:** *[Brief context]*
**Action:** *[What they did]*
**Result:** *[Specific outcomes with numbers]*
**Lesson:** *[Key takeaway]*

---

## Common Pitfalls

*[300-400 words covering typical mistakes, warning signs, and how to avoid them]*

### The Top 5 Mistakes

1. **[Mistake 1]** - *[Description and how to avoid]*
2. **[Mistake 2]** - *[Description and how to avoid]*
3. **[Mistake 3]** - *[Description and how to avoid]*
4. **[Mistake 4]** - *[Description and how to avoid]*
5. **[Mistake 5]** - *[Description and how to avoid]*

---

## Application Exercise

*[200-300 words with practical scenario, questions for reflection, and next steps]*

### Scenario
*[Detailed business scenario for the reader to work through]*

### Reflection Questions
1. What would be your first three actions in this situation?
2. How would you measure success?
3. What are the potential second-order consequences?
4. How would you communicate this decision to stakeholders?

### Next Steps
- [ ] Assess your current situation using the framework
- [ ] Identify the top 3 areas for improvement
- [ ] Develop an action plan with specific timelines
- [ ] Set up measurement and monitoring systems

---

## Key Takeaways

*[100-150 words with 5-7 bullet points of actionable insights]*

- **[Takeaway 1]:** *[Specific, actionable insight]*
- **[Takeaway 2]:** *[Specific, actionable insight]*
- **[Takeaway 3]:** *[Specific, actionable insight]*
- **[Takeaway 4]:** *[Specific, actionable insight]*
- **[Takeaway 5]:** *[Specific, actionable insight]*
- **[Takeaway 6]:** *[Specific, actionable insight]*
- **[Takeaway 7]:** *[Specific, actionable insight]*

---

## Further Reading

### Essential Resources
- **Book:** *[Relevant book title]* by [Author]
- **Article:** *[Relevant article title]* - [Publication]
- **Case Study:** *[Harvard Business Review case or similar]*
- **Research:** *[Academic paper or industry report]*

### Advanced Topics
- Link to related lesson: [Module X.Y: Related Topic]
- External resource: [Industry report or analysis]
- Tool/Template: [Practical resource for implementation]

---

*This lesson is part of the **${domain.title}** domain in the Execemy Executive Education curriculum.*
`

    try {
      // Check if file already exists
      try {
        await import('fs').then(fs => fs.promises.access(fullPath))
        console.log(`   ⏭️  Skipped (exists): ${path.filePath}`)
        skipped++
        continue
      } catch {
        // File doesn't exist, create it
      }

      await writeFile(fullPath, template, 'utf-8')
      console.log(`   ✅ Created: ${path.filePath}`)
      created++
    } catch (error) {
      console.error(`   ❌ Error creating ${path.filePath}:`, error)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   📁 Directories created: ${directories.size}`)
  console.log(`   📄 Template files created: ${created}`)
  console.log(`   ⏭️  Files skipped (already exist): ${skipped}`)
  console.log(`   📚 Total lessons: ${contentPaths.length}`)

  // Create index files for each domain
  console.log('\n📋 Creating domain index files...')
  
  for (const [domainIndex, domain] of completeCurriculumData.entries()) {
    const domainNumber = String(domainIndex + 1).padStart(2, '0')
    const numberedDomainPath = `${domainNumber}-${domain.id}`
    const indexPath = join(baseDir, `content/curriculum/${numberedDomainPath}/README.md`)
    
    const indexContent = `# ${domain.title}

${domain.philosophy}

## Modules Overview

${domain.modules.map(module => {
      const moduleNumber = String(module.number).padStart(2, '0')
      const numberedModulePath = `${moduleNumber}-${module.id}`
      return `
### Module ${module.number}: ${module.title}

${module.description}

**Lessons:**
${module.lessons.map(lesson => {
        const lessonNumber = String(lesson.number).padStart(2, '0')
        const numberedLessonFile = `${lessonNumber}-${lesson.id}.md`
        return `- [${module.number}.${lesson.number}: ${lesson.title}](./${numberedModulePath}/${numberedLessonFile})`
      }).join('\n')}
`
    }).join('\n')}

---

**Total Modules:** ${domain.modules.length}  
**Total Lessons:** ${domain.modules.reduce((sum, m) => sum + m.lessons.length, 0)}  
**Estimated Completion Time:** ${domain.modules.reduce((sum, m) => sum + m.lessons.length, 0) * 12} minutes reading

*Part of the Execemy Executive Education Curriculum*
`

    try {
      await writeFile(indexPath, indexContent, 'utf-8')
      console.log(`   ✅ Created domain index: content/curriculum/${numberedDomainPath}/README.md`)
    } catch (error) {
      console.error(`   ❌ Error creating domain index for ${domain.id}:`, error)
    }
  }

  // Create master curriculum index
  const masterIndexPath = join(baseDir, 'content/curriculum/README.md')
  const masterIndexContent = `# Execemy Executive Education Curriculum

A comprehensive curriculum for developing world-class CEOs and senior executives.

## Curriculum Overview

${completeCurriculumData.map((domain, domainIndex) => {
    const domainNumber = String(domainIndex + 1).padStart(2, '0')
    const numberedDomainPath = `${domainNumber}-${domain.id}`
    return `
### ${domain.title}

${domain.philosophy}

**Modules:** ${domain.modules.length} | **Lessons:** ${domain.modules.reduce((sum, m) => sum + m.lessons.length, 0)}

[📖 View Domain →](./${numberedDomainPath}/README.md)
`
  }).join('\n')}

## Curriculum Statistics

- **Total Domains:** ${completeCurriculumData.length}
- **Total Modules:** ${completeCurriculumData.reduce((sum, d) => sum + d.modules.length, 0)}
- **Total Lessons:** ${completeCurriculumData.reduce((sum, d) => sum + d.modules.reduce((mSum, m) => mSum + m.lessons.length, 0), 0)}
- **Estimated Total Reading Time:** ${completeCurriculumData.reduce((sum, d) => sum + d.modules.reduce((mSum, m) => mSum + m.lessons.length, 0), 0) * 12} minutes

## Content Structure

\`\`\`
content/curriculum/
${completeCurriculumData.map((domain, domainIndex) => {
    const domainNumber = String(domainIndex + 1).padStart(2, '0')
    const numberedDomain = `${domainNumber}-${domain.id}`
    const firstModule = domain.modules[0]
    if (!firstModule) return `├── ${numberedDomain}/`
    const moduleNumber = String(firstModule.number).padStart(2, '0')
    const numberedModule = `${moduleNumber}-${firstModule.id}`
    const firstLesson = firstModule.lessons[0]
    if (!firstLesson) return `├── ${numberedDomain}/\n│   └── ${numberedModule}/`
    const lessonNumber = String(firstLesson.number).padStart(2, '0')
    const numberedLesson = `${lessonNumber}-${firstLesson.id}.md`
    return `├── ${numberedDomain}/\n│   ├── README.md\n│   ├── ${numberedModule}/\n│   │   ├── ${numberedLesson}\n│   │   └── [other lessons...]\n│   └── [other modules...]`
  }).join('\n')}
└── [other domains...]
\`\`\`

---

*Generated on ${new Date().toISOString()}*
`

  try {
    await writeFile(masterIndexPath, masterIndexContent, 'utf-8')
    console.log(`   ✅ Created master index: content/curriculum/README.md`)
  } catch (error) {
    console.error(`   ❌ Error creating master index:`, error)
  }

  console.log('\n🎉 Curriculum Structure Creation Complete!')
  console.log('\n📋 Next Steps:')
  console.log('   1. Review the generated template files')
  console.log('   2. Fill in the content for each lesson')
  console.log('   3. Use the AI content generator to create comprehensive lessons')
  console.log('   4. Update the library to display the new curriculum structure')
  console.log('\n🚀 Ready for content creation!')
}

// Run the structure creation
createCurriculumStructure().catch(console.error)
