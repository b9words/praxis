#!/usr/bin/env tsx

/**
 * Generate or regenerate a case file asset
 * 
 * Usage:
 *   tsx scripts/generate-case-asset.ts --case-id cs_xxx --file-id financial_data
 *   tsx scripts/generate-case-asset.ts --case-id cs_xxx --new --type FINANCIAL_DATA --file-name "Q1_2024_Financials.csv"
 */

import { buildAssetGenerationPrompt } from '../lib/case-generation-prompts'
import { generateWithAI } from './generate-shared'
import fs from 'fs'
import path from 'path'

interface GenerateOptions {
  caseId: string
  fileId?: string
  new?: boolean
  type?: string
  fileName?: string
  overwrite?: boolean
}

/**
 * Main generation function
 */
async function generateAsset(options: GenerateOptions) {
  const { caseId, fileId, new: isNew, type, fileName, overwrite = false } = options

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

  // Determine file extension
  const isCSV = asset.fileType === 'FINANCIAL_DATA'
  const ext = isCSV ? 'csv' : 'md'
  const sourcesDir = path.join(process.cwd(), 'content', 'sources', caseId)
  if (!fs.existsSync(sourcesDir)) {
    fs.mkdirSync(sourcesDir, { recursive: true })
  }

  const finalFileName = asset.fileName.endsWith(ext) ? asset.fileName : `${asset.fileName}.${ext}`
  const filePath = path.join(sourcesDir, finalFileName)

  // Save file
  fs.writeFileSync(filePath, result.content, 'utf-8')
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
  }
}

// Run
generateAsset(options).catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

