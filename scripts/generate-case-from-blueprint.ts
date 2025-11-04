#!/usr/bin/env tsx

/**
 * Generate case study from blueprint
 * 
 * Usage:
 *   tsx scripts/generate-case-from-blueprint.ts --arena ARENA_1 --competency "Organizational Design" --blueprint-id two_pizza_reorg
 *   tsx scripts/generate-case-from-blueprint.ts --arena ARENA_1 --competency "Organizational Design" --blueprint-title "Two-Pizza Team"
 */

import { buildCaseOutlinePrompt, buildCaseGenerationPrompt } from '../lib/case-generation-prompts'
import { generateWithAI, uploadToStorage, syncFileMetadata, generateAndUploadThumbnail, isSupabaseAvailable } from './generate-shared'
import fs from 'fs'
import path from 'path'

interface GenerateOptions {
  arenaId?: string
  competencyName?: string
  blueprintId?: string
  blueprintTitle?: string
  caseId?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration?: number
}

/**
 * Main generation function
 */
async function generateCaseFromBlueprint(options: GenerateOptions) {
  const {
    arenaId,
    competencyName,
    blueprintId,
    blueprintTitle,
    caseId,
    difficulty,
    estimatedDuration,
  } = options

  console.log('🎯 Case Study Generation from Blueprint\n')
  console.log('========================================\n')

  if (!arenaId || !competencyName || (!blueprintId && !blueprintTitle)) {
    throw new Error('Missing required: --arena, --competency, and --blueprint-id or --blueprint-title')
  }

  // Load taxonomy
  const taxonomyPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'arenas.json')
  if (!fs.existsSync(taxonomyPath)) {
    throw new Error('Taxonomy not found. Run scripts/convert-case-blueprints.ts first.')
  }

  const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf-8')
  const taxonomy = JSON.parse(taxonomyContent)

  // Find arena, competency, blueprint
  const arena = taxonomy.arenas.find((a: any) => a.id === arenaId)
  if (!arena) {
    throw new Error(`Arena ${arenaId} not found`)
  }

  const competency = arena.competencies.find(
    (c: any) => c.name === competencyName || c.name.includes(competencyName)
  )
  if (!competency) {
    throw new Error(`Competency "${competencyName}" not found in ${arenaId}`)
  }

  const blueprint = blueprintId
    ? competency.blueprints.find((b: any) => b.id === blueprintId)
    : competency.blueprints.find((b: any) => b.title === blueprintTitle || b.title.includes(blueprintTitle || ''))

  if (!blueprint) {
    throw new Error(`Blueprint ${blueprintId || blueprintTitle} not found`)
  }

  console.log(`📋 Blueprint: ${blueprint.title}`)
  console.log(`   Arena: ${arena.name}`)
  console.log(`   Competency: ${competency.name}`)
  console.log(`   Challenge Type: ${blueprint.challengeType}\n`)

  // Load framework
  const frameworkPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'framework.json')
  const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
  const framework = JSON.parse(frameworkContent)

  // Generate outline
  console.log('📋 Generating outline...')
  const outlinePrompt = buildCaseOutlinePrompt(blueprint, competency, framework)
  const outlineResult = await generateWithAI(
    outlinePrompt,
    'You are an expert business educator specializing in executive case study design.',
    { trackUsage: true }
  )
  console.log('✅ Outline generated\n')

  // Generate full case
  const finalCaseId = caseId || `cs_${blueprint.id}_${Date.now()}`
  console.log(`✍️  Generating full case (ID: ${finalCaseId})...`)
  const casePrompt = buildCaseGenerationPrompt(
    outlineResult.content,
    blueprint,
    competency,
    framework,
    finalCaseId
  )

  const caseResult = await generateWithAI(
    casePrompt,
    'You are an expert business educator specializing in executive case study design. Generate complete, realistic, challenging case study JSON structures.',
    { trackUsage: true }
  )
  console.log(`✅ Case generated (${caseResult.model})\n`)

  // Parse JSON
  let caseJsonStr = caseResult.content.trim()
  if (caseJsonStr.startsWith('```json')) {
    caseJsonStr = caseJsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (caseJsonStr.startsWith('```')) {
    caseJsonStr = caseJsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }

  let caseData: any
  try {
    caseData = JSON.parse(caseJsonStr)
  } catch (parseError) {
    console.error('❌ Failed to parse JSON:', parseError)
    console.error('Raw output (first 500 chars):', caseJsonStr.substring(0, 500))
    throw new Error('Invalid JSON generated')
  }

  // Apply overrides
  if (difficulty) caseData.difficulty = difficulty
  if (estimatedDuration) caseData.estimatedDuration = estimatedDuration
  caseData.status = 'draft'
  caseData.caseId = finalCaseId

  // Save to data/case-studies
  const outputPath = path.join(process.cwd(), 'data', 'case-studies', `${finalCaseId}.json`)
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  fs.writeFileSync(outputPath, JSON.stringify(caseData, null, 2), 'utf-8')
  console.log(`💾 Saved to ${outputPath}\n`)

  // Upload to storage
  console.log('☁️  Uploading to storage...')
  const storagePath = `cases/year1/${arenaId.toLowerCase()}/${competency.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}/${finalCaseId}.json`
  await uploadToStorage(storagePath, JSON.stringify(caseData, null, 2), 'application/json')
  console.log('✅ Uploaded\n')

  // Sync metadata
  console.log('🔄 Syncing metadata...')
  let syncResult: any = null
  try {
    syncResult = await syncFileMetadata(storagePath)
    console.log(`✅ Metadata synced (case_id: ${syncResult?.case_id || 'N/A'})\n`)
  } catch (syncError) {
    console.warn(`⚠️  Metadata sync failed: ${syncError}\n`)
  }

  // Generate thumbnail
  const dbCaseId = syncResult?.case_id
  if (dbCaseId && isSupabaseAvailable()) {
    console.log('🎨 Generating thumbnail...')
    try {
      await generateAndUploadThumbnail(
        dbCaseId,
        'case',
        caseData.title,
        arena.theme,
        competency.name
      )
      console.log('✅ Thumbnail generated\n')
    } catch (thumbError) {
      console.warn(`⚠️  Thumbnail generation failed: ${thumbError}\n`)
    }
  }

  console.log('✅ Generation complete!\n')
  console.log('📝 Next steps:')
  console.log(`   1. Review case: ${outputPath}`)
  console.log(`   2. Generate assets: tsx scripts/generate-case-asset.ts --case-id ${finalCaseId}`)
  console.log(`   3. Publish: tsx scripts/publish-content.ts --type case --path ${storagePath}`)
}

// CLI parsing
const args = process.argv.slice(2)
const options: GenerateOptions = {}

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--arena' && args[i + 1]) {
    options.arenaId = args[i + 1]
    i++
  } else if (args[i] === '--competency' && args[i + 1]) {
    options.competencyName = args[i + 1]
    i++
  } else if (args[i] === '--blueprint-id' && args[i + 1]) {
    options.blueprintId = args[i + 1]
    i++
  } else if (args[i] === '--blueprint-title' && args[i + 1]) {
    options.blueprintTitle = args[i + 1]
    i++
  } else if (args[i] === '--case-id' && args[i + 1]) {
    options.caseId = args[i + 1]
    i++
  } else if (args[i] === '--difficulty' && args[i + 1]) {
    options.difficulty = args[i + 1] as any
    i++
  } else if (args[i] === '--duration' && args[i + 1]) {
    options.estimatedDuration = parseInt(args[i + 1], 10)
    i++
  }
}

// Run
generateCaseFromBlueprint(options).catch(error => {
  console.error('\n❌ Error:', error)
  process.exit(1)
})

