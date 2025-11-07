#!/usr/bin/env tsx

/**
 * Generate or regenerate a case file asset
 * 
 * Usage:
 *   tsx scripts/generate-case-asset.ts --case-id cs_xxx --file-id financial_data
 *   tsx scripts/generate-case-asset.ts --case-id cs_xxx --new --type FINANCIAL_DATA --file-name "Q1_2024_Financials.csv"
 */

import fs from 'fs'
import path from 'path'
import { buildAssetGenerationPrompt } from '../lib/case-generation-prompts'
import { generateWithAI } from './generate-shared'

interface GenerateOptions {
  caseId: string
  fileId?: string
  new?: boolean
  type?: string
  fileName?: string
  overwrite?: boolean
  debug?: boolean
}

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean
  errors: string[]
  content?: string
}

/**
 * Validate asset content based on file type (mirrors API validation)
 */
function validateAssetContent(
  content: string,
  fileType: string,
  fileName: string
): ValidationResult {
  const errors: string[] = []
  let cleanedContent = content.trim()

  // Remove code fences if present
  if (cleanedContent.startsWith('```')) {
    const lines = cleanedContent.split('\n')
    if (lines[0].startsWith('```')) {
      lines.shift()
    }
    if (lines[lines.length - 1].trim() === '```') {
      lines.pop()
    }
    cleanedContent = lines.join('\n').trim()
  }

  // Check for placeholders
  if (/\bPlaceholder\b|\[Placeholder/i.test(cleanedContent)) {
    errors.push('Content contains placeholder text')
  }

  // Type-specific validation
  switch (fileType) {
    case 'PRESENTATION_DECK': {
      if (!/^---\s*\n[\s\S]*?\n---\s*\n/.test(cleanedContent)) {
        errors.push('Missing Marp frontmatter')
      }
      const slideSeparators = (cleanedContent.match(/\n---\n/g) || []).length
      if (slideSeparators < 7) {
        errors.push(`Too few slides: found ${slideSeparators + 1}, need at least 8`)
      } else if (slideSeparators > 11) {
        errors.push(`Too many slides: found ${slideSeparators + 1}, need at most 12`)
      }
      break
    }

    case 'FINANCIAL_DATA': {
      const lines = cleanedContent.split('\n').filter(line => line.trim())
      if (lines.length < 13) {
        errors.push(`Too few rows: found ${lines.length}, need at least 13`)
      } else {
        const header = lines[0]
        if (!header.includes(',')) {
          errors.push('CSV header missing or invalid')
        } else {
          const headerCols = header.split(',').length
          if (headerCols < 2) {
            errors.push('CSV header must have at least 2 columns')
          }
        }
      }
      break
    }

    case 'STAKEHOLDER_PROFILES': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (!Array.isArray(parsed)) {
          errors.push('Must be a top-level JSON array')
        } else {
          if (parsed.length < 3 || parsed.length > 6) {
            errors.push(`Array length must be 3-6, found ${parsed.length}`)
          }
          parsed.forEach((item: any, idx: number) => {
            if (!item.name || typeof item.name !== 'string') {
              errors.push(`Item ${idx}: missing 'name' field`)
            }
            if (!item.title || typeof item.title !== 'string') {
              errors.push(`Item ${idx}: missing 'title' field`)
            }
            if (!item.role || typeof item.role !== 'string') {
              errors.push(`Item ${idx}: missing 'role' field`)
            }
            if (!Array.isArray(item.concerns) || item.concerns.length === 0) {
              errors.push(`Item ${idx}: 'concerns' must be non-empty array`)
            }
            if (!Array.isArray(item.motivations) || item.motivations.length === 0) {
              errors.push(`Item ${idx}: 'motivations' must be non-empty array`)
            }
          })
        }
      } catch (e) {
        errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`)
      }
      break
    }

    case 'MARKET_DATASET': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (!Array.isArray(parsed)) {
          errors.push('Must be a JSON array')
        } else {
          if (parsed.length < 12) {
            errors.push(`Array must have at least 12 items, found ${parsed.length}`)
          }
          parsed.forEach((item: any, idx: number) => {
            if (typeof item !== 'object' || item === null) {
              errors.push(`Item ${idx}: must be an object`)
            } else {
              const hasTimeKey = ['date', 'period', 'month', 'quarter', 'year'].some(
                key => key in item
              )
              if (!hasTimeKey) {
                errors.push(`Item ${idx}: missing time key`)
              }
              const numericKeys = Object.keys(item).filter(
                k => typeof item[k] === 'number'
              )
              if (numericKeys.length < 2) {
                errors.push(`Item ${idx}: must have at least 2 numeric keys`)
              }
            }
          })
        }
      } catch (e) {
        errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`)
      }
      break
    }

    case 'ORG_CHART': {
      try {
        const parsed = JSON.parse(cleanedContent)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          errors.push('Must be a JSON object (not array)')
        } else {
          if (!parsed.organization || !Array.isArray(parsed.organization)) {
            errors.push("Missing or invalid 'organization' array")
          }
        }
      } catch (e) {
        errors.push(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`)
      }
      break
    }

    case 'REPORT':
    case 'INTERNAL_MEMO':
    case 'PRESS_RELEASE':
    case 'LEGAL_DOCUMENT':
    case 'MEMO': {
      if (cleanedContent.length < 300) {
        errors.push(`Content too short: ${cleanedContent.length} chars, need at least 300`)
      }
      if (!/#|##/.test(cleanedContent)) {
        errors.push('Missing headings')
      }
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    content: cleanedContent,
  }
}

/**
 * Main generation function
 */
async function generateAsset(options: GenerateOptions) {
  const { caseId, fileId, new: isNew, type, fileName, overwrite = false, debug = false } = options

  console.log('📄 Case Asset Generation\n')
  console.log('========================\n')

  if (!caseId || (!fileId && !isNew)) {
    throw new Error('Missing required: --case-id and either --file-id or --new with --type and --file-name')
  }

  // Load case
  const casePath = path.join(process.cwd(), 'data', 'case-studies', `${caseId}.json`)
  if (!fs.existsSync(casePath)) {
    throw new Error(`Case not found: ${casePath}`)
  }

  const caseContent = fs.readFileSync(casePath, 'utf-8')
  const caseData = JSON.parse(caseContent)

  console.log(`📋 Case: ${caseData.title}`)
  console.log(`   ID: ${caseId}\n`)

  // Find or create asset
  let asset: any
  if (isNew) {
    if (!type || !fileName) {
      throw new Error('New asset requires --type and --file-name')
    }

    asset = {
      fileId: fileName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/\.[^.]+$/, ''),
      fileName,
      fileType: type,
      source: { type: 'STATIC', content: '' },
    }
    caseData.caseFiles = caseData.caseFiles || []
    caseData.caseFiles.push(asset)
    console.log(`➕ Creating new asset: ${fileName} (${type})\n`)
  } else {
    asset = caseData.caseFiles?.find((f: any) => f.fileId === fileId)
    if (!asset) {
      throw new Error(`File ${fileId} not found in case`)
    }
    console.log(`🔄 Regenerating asset: ${asset.fileName} (${asset.fileType})\n`)

    if (asset.source?.type === 'REFERENCE' && !overwrite) {
      throw new Error('File is REFERENCE type. Use --overwrite to regenerate.')
    }
  }

  // Load taxonomy for blueprint context
  const taxonomyPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'arenas.json')
  const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf-8')
  const taxonomy = JSON.parse(taxonomyContent)

  // Find matching blueprint
  let blueprint: any = null
  let competency: any = null

  for (const arena of taxonomy.arenas) {
    for (const comp of arena.competencies) {
      const match = comp.blueprints.find((b: any) =>
        caseData.title?.includes(b.title) || caseId.includes(b.id)
      )
      if (match) {
        blueprint = match
        competency = comp
        break
      }
    }
    if (blueprint) break
  }

  // Load framework
  const frameworkPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'framework.json')
  const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
  const framework = JSON.parse(frameworkContent)

  // Generate asset
  console.log('🤖 Generating asset content...')
  const assetPrompt = buildAssetGenerationPrompt(
    asset.fileName.replace(/\.[^.]+$/, ''),
    asset.fileType as any,
    blueprint || {
      title: caseData.title || '',
      dilemma: caseData.description || '',
      task: '',
      assets: [],
    },
    competency || {
      name: caseData.competencies?.[0] || 'Strategic Thinking',
      primaryChallengeType: '',
      secondaryTypes: [],
      blueprints: [],
    },
    framework
  )

  const result = await generateWithAI(
    assetPrompt,
    'You are an expert business analyst creating realistic case study materials.',
    { trackUsage: true }
  )
  console.log(`✅ Generated (${result.model})\n`)

  // Validate content
  const validation = validateAssetContent(result.content, asset.fileType, asset.fileName)
  const finalContent = validation.content || result.content

  if (!validation.valid) {
    console.warn('⚠️  Validation warnings:')
    validation.errors.forEach(err => console.warn(`   - ${err}`))
    console.warn('   Continuing anyway...\n')
  } else {
    console.log('✅ Validation passed\n')
  }

  // Debug output
  if (debug) {
    console.log('📊 Debug Info:')
    console.log(`   Model: ${result.model}`)
    console.log(`   Content length: ${finalContent.length} chars`)
    console.log(`   Validation: ${validation.valid ? 'PASS' : 'FAIL'}`)
    console.log(`   Validation errors: ${validation.errors.length}`)
    console.log(`   First 300 chars:`)
    console.log('   ' + '─'.repeat(50))
    console.log(finalContent.substring(0, 300).split('\n').map(line => `   ${line}`).join('\n'))
    console.log('   ' + '─'.repeat(50))
    console.log()
  }

  // Determine file extension
  const isCSV = asset.fileType === 'FINANCIAL_DATA'
  const isJSON = asset.fileType === 'ORG_CHART' || asset.fileType === 'STAKEHOLDER_PROFILES' || asset.fileType === 'MARKET_DATASET'
  const ext = isCSV ? 'csv' : isJSON ? 'json' : 'md'
  const sourcesDir = path.join(process.cwd(), 'content', 'sources', caseId)
  if (!fs.existsSync(sourcesDir)) {
    fs.mkdirSync(sourcesDir, { recursive: true })
  }

  // Normalize file extension
  const baseName = asset.fileName.replace(/\.[^.]+$/, '')
  const finalFileName = `${baseName}.${ext}`
  const filePath = path.join(sourcesDir, finalFileName)

  // Save file
  fs.writeFileSync(filePath, finalContent, 'utf-8')
  console.log(`💾 Saved to ${filePath}\n`)

  // Update case JSON
  asset.source = {
    type: 'REFERENCE',
    path: `content/sources/${caseId}/${finalFileName}`,
  }

  fs.writeFileSync(casePath, JSON.stringify(caseData, null, 2), 'utf-8')
  console.log(`✅ Updated case JSON\n`)

  console.log('✅ Asset generation complete!')
  console.log(`   File: ${filePath}`)
  console.log(`   Path in case: ${asset.source.path}`)
}

// CLI parsing
const args = process.argv.slice(2)
const options: GenerateOptions = {} as any

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--case-id' && args[i + 1]) {
    options.caseId = args[i + 1]
    i++
  } else if (args[i] === '--file-id' && args[i + 1]) {
    options.fileId = args[i + 1]
    i++
  } else if (args[i] === '--new') {
    options.new = true
  } else if (args[i] === '--type' && args[i + 1]) {
    options.type = args[i + 1]
    i++
  } else if (args[i] === '--file-name' && args[i + 1]) {
    options.fileName = args[i + 1]
    i++
  } else if (args[i] === '--overwrite') {
    options.overwrite = true
  } else if (args[i] === '--debug') {
    options.debug = true
  }
}

// Run
generateAsset(options).catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

