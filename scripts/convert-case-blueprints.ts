#!/usr/bin/env tsx

/**
 * Convert case study blueprint markdown files into JSON taxonomy
 * 
 * Usage:
 *   tsx scripts/convert-case-blueprints.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Blueprint {
  id: string
  title: string
  challengeType: string
  dilemma: string
  task: string
  assets: string[]
}

interface Competency {
  name: string
  primaryChallengeType: string
  secondaryTypes: string[]
  blueprints: Blueprint[]
}

interface Arena {
  id: string
  name: string
  theme: string
  competencies: Competency[]
}

interface Taxonomy {
  arenas: Arena[]
}

/**
 * Parse arena markdown file and extract blueprints
 */
function parseArenaMarkdown(filePath: string, arenaId: string, arenaName: string, theme: string): Arena {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  const arena: Arena = {
    id: arenaId,
    name: arenaName,
    theme,
    competencies: []
  }

  // Split by competency sections (format: #### **Core Competency: Name**)
  const competencySections = content.split(/#### \*\*Core Competency:\s*([^*]+)\*\*/)
  
  for (let i = 1; i < competencySections.length; i += 2) {
    const competencyName = competencySections[i]?.trim()
    const section = competencySections[i + 1] || ''
    
    if (!competencyName) continue
    
    // For now, we'll extract primary/secondary from types.md table
    // This will be enriched when we parse types.md
    const competency: Competency = {
      name: competencyName,
      primaryChallengeType: '', // Will be set from types.md
      secondaryTypes: [], // Will be set from types.md
      blueprints: []
    }
    
    // Extract blueprints (format: **N. Title: ...**)
    const blueprintMatches = Array.from(section.matchAll(/\*\*(\d+)\. Title:\s*([^*]+?)\*\*/g))
    
    for (let j = 0; j < blueprintMatches.length; j++) {
      const match = blueprintMatches[j]
      const blueprintNumber = match[1]
      const blueprintTitle = match[2].trim()
      
      // Find content between this blueprint and the next (or end of section)
      const startPos = match.index || 0
      const endPos = j < blueprintMatches.length - 1 
        ? (blueprintMatches[j + 1].index || section.length)
        : section.length
      const blueprintContent = section.substring(startPos, endPos)
      
      // Extract fields (format: *   **Field:** value)
      const challengeTypeMatch = blueprintContent.match(/\*\*Challenge Type:\*\*\s*(.+?)(?:\n|\*|$)/s)
      const dilemmaMatch = blueprintContent.match(/\*\*Dilemma:\*\*\s*(.+?)(?:\*\*Task:|\*|$)/s)
      const taskMatch = blueprintContent.match(/\*\*Task:\*\*\s*(.+?)(?:\*\*Case File Assets:|\*|$)/s)
      
      const assets: string[] = []
      // Extract assets (format: *   `[Asset Name]` Description)
      const assetsStart = blueprintContent.indexOf('**Case File Assets:**')
      if (assetsStart !== -1) {
        const assetsSection = blueprintContent.substring(assetsStart)
        const assetMatches = assetsSection.matchAll(/`\[([^\]]+)\]`/g)
        for (const assetMatch of assetMatches) {
          assets.push(assetMatch[1])
        }
      }
      
      const blueprint: Blueprint = {
        id: `${arenaId.toLowerCase()}_${blueprintNumber}_${blueprintTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').substring(0, 50)}`,
        title: blueprintTitle,
        challengeType: challengeTypeMatch ? challengeTypeMatch[1].trim() : '',
        dilemma: dilemmaMatch ? dilemmaMatch[1].trim() : '',
        task: taskMatch ? taskMatch[1].trim() : '',
        assets
      }
      
      competency.blueprints.push(blueprint)
    }
    
    arena.competencies.push(competency)
  }
  
  return arena
}

/**
 * Parse types.md to extract competency mappings
 */
function parseTypesMarkdown(filePath: string, taxonomy: Taxonomy): void {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Find each arena section
  const arenaHeaderRegex = /### \*\*Arena (\d+): [^\n]+\*\*/g
  const headers = Array.from(content.matchAll(arenaHeaderRegex))
  
  for (let i = 0; i < headers.length; i++) {
    const arenaNumber = parseInt(headers[i][1], 10)
    const arena = taxonomy.arenas.find(a => a.id === `ARENA_${arenaNumber}`)
    if (!arena) continue
    
    const start = headers[i].index!
    const end = i < headers.length - 1 ? headers[i + 1].index! : content.length
    const arenaSection = content.substring(start, end)
    
    // Extract markdown table rows (skip header and alignment lines)
    const lines = arenaSection.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      // Table data rows start with '|' but are not header or alignment lines
      if (!trimmed.startsWith('|')) continue
      if (trimmed.startsWith('| :') || trimmed.includes('Core Competency')) continue
      
      const cellsRaw = trimmed.split('|').slice(1, -1)
      if (cellsRaw.length < 4) continue
      
      const cell0 = cellsRaw[0].replace(/\*\*/g, '').trim()
      const cell1 = cellsRaw[1].replace(/\*\*/g, '').trim()
      const cell2 = cellsRaw[2].replace(/\*\*/g, '').trim()
      
      if (!cell0 || !cell1) continue
      
      // Match competency by normalized name
      const norm = (s: string) => s.replace(/['"`]/g, '').trim().toLowerCase()
      const competency = arena.competencies.find(c => norm(c.name) === norm(cell0))
      if (!competency) continue
      
      competency.primaryChallengeType = cell1
      competency.secondaryTypes = cell2 ? cell2.split(',').map(t => t.trim()).filter(Boolean) : []
    }
  }
}

/**
 * Main conversion function
 */
function convertBlueprints() {
  console.log('🔄 Converting case study blueprints to JSON taxonomy\n')
  console.log('===================================================\n')
  
  const taxonomy: Taxonomy = {
    arenas: []
  }
  
  const coreDocsDir = path.join(__dirname, '..', 'core-docs', 'case-study-v2')
  
  // Parse arena files
  const arenaFiles = [
    { file: 'arena1.md', id: 'ARENA_1', name: 'The Office', theme: 'Internal Leadership & Execution' },
    { file: 'arena2.md', id: 'ARENA_2', name: 'The Deal Room', theme: 'M&A & Negotiations' },
    { file: 'arena3.md', id: 'ARENA_3', name: 'The Board Room', theme: 'Governance & High-Stakes Persuasion' },
    { file: 'arena4.md', id: 'ARENA_4', name: 'The Platform', theme: 'Public & Investor Narrative' },
    { file: 'arena5.md', id: 'ARENA_5', name: 'The War Room', theme: 'Crisis & High-Velocity Events' }
  ]
  
  for (const arenaFile of arenaFiles) {
    const filePath = path.join(coreDocsDir, arenaFile.file)
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Warning: ${arenaFile.file} not found`)
      continue
    }
    
    console.log(`📖 Parsing ${arenaFile.file}...`)
    const arena = parseArenaMarkdown(filePath, arenaFile.id, arenaFile.name, arenaFile.theme)
    taxonomy.arenas.push(arena)
    console.log(`   ✓ Found ${arena.competencies.length} competencies, ${arena.competencies.reduce((sum, c) => sum + c.blueprints.length, 0)} blueprints\n`)
  }
  
  // Enrich with types.md data
  const typesPath = path.join(coreDocsDir, 'types.md')
  if (fs.existsSync(typesPath)) {
    console.log('📖 Parsing types.md to enrich competency mappings...\n')
    parseTypesMarkdown(typesPath, taxonomy)
  }
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'content', 'cases', 'taxonomy')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // Write arenas.json
  const arenasPath = path.join(outputDir, 'arenas.json')
  fs.writeFileSync(arenasPath, JSON.stringify(taxonomy, null, 2), 'utf-8')
  console.log(`✅ Wrote ${arenasPath}`)
  console.log(`   Total: ${taxonomy.arenas.length} arenas, ${taxonomy.arenas.reduce((sum, a) => sum + a.competencies.length, 0)} competencies, ${taxonomy.arenas.reduce((sum, a) => sum + a.competencies.reduce((s, c) => s + c.blueprints.length, 0), 0)} blueprints\n`)
  
  // Generate challenge-type-map.json
  console.log('📋 Generating challenge-type-map.json...\n')
  const challengeTypeMap = generateChallengeTypeMap(taxonomy)
  const mapPath = path.join(outputDir, 'challenge-type-map.json')
  fs.writeFileSync(mapPath, JSON.stringify(challengeTypeMap, null, 2), 'utf-8')
  console.log(`✅ Wrote ${mapPath}\n`)
  
  // Extract framework
  console.log('📋 Extracting framework.json...\n')
  const frameworkPath = path.join(coreDocsDir, 'framework.md')
  if (fs.existsSync(frameworkPath)) {
    const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
    const frameworkJson = {
      title: 'The Crucible Framework: A 3-Step Guide to Creating Case Studies',
      content: frameworkContent,
      step1: extractSection(frameworkContent, 'Step 1: The Core'),
      step2: extractSection(frameworkContent, 'Step 2: The Content'),
      step3: extractSection(frameworkContent, 'Step 3: The Feedback')
    }
    const frameworkOutputPath = path.join(outputDir, 'framework.json')
    fs.writeFileSync(frameworkOutputPath, JSON.stringify(frameworkJson, null, 2), 'utf-8')
    console.log(`✅ Wrote ${frameworkOutputPath}\n`)
  }
  
  console.log('✅ Conversion complete!')
}

/**
 * Extract a section from markdown
 */
function extractSection(content: string, sectionTitle: string): string {
  const startMatch = content.indexOf(`#### **${sectionTitle}`)
  if (startMatch === -1) return ''
  
  const nextSectionMatch = content.substring(startMatch + 1).match(/#### \*\*/)
  const endPos = nextSectionMatch ? startMatch + 1 + content.substring(startMatch + 1).indexOf(nextSectionMatch[0]) : content.length
  
  return content.substring(startMatch, endPos).trim()
}

/**
 * Generate challenge type mapping from taxonomy
 */
function generateChallengeTypeMap(taxonomy: Taxonomy): Record<string, string> {
  const map: Record<string, string> = {}
  
  // Define mappings based on reference names
  const mappings: Record<string, string> = {
    'The First 100 Days Plan': 'WRITTEN_ANALYSIS',
    'The "Turnaround" Town Hall Script': 'WRITTEN_ANALYSIS',
    'Turnaround Town Hall Script': 'WRITTEN_ANALYSIS',
    'Public Statement / Press Release': 'WRITTEN_ANALYSIS',
    'Public Statement': 'WRITTEN_ANALYSIS',
    'Press Release': 'WRITTEN_ANALYSIS',
    'Investment Committee Memo': 'WRITTEN_ANALYSIS',
    'Emergency Board Communication': 'WRITTEN_ANALYSIS',
    'Public Shareholder Letter': 'WRITTEN_ANALYSIS',
    'Internal "Call to Action" Memo': 'WRITTEN_ANALYSIS',
    'Capital Allocation Stack Rank': 'STRATEGIC_OPTIONS',
    'Product Recall Decision': 'STRATEGIC_OPTIONS',
    'Board Deck Critique': 'BOARD_DECK_CRITIQUE',
    'Earnings Call Q&A': 'EARNINGS_CALL_QA',
    'S-1 Teardown': 'FINANCIAL_MODELING',
    'The "Back of the Envelope" Model': 'FINANCIAL_MODELING',
    'Back of the Envelope Model': 'FINANCIAL_MODELING',
    'High-Stakes Negotiation': 'NEGOTIATION',
    'The Redline Negotiation': 'NEGOTIATION',
    'Redline Negotiation': 'NEGOTIATION',
    'Activist Investor Dialogue': 'NEGOTIATION',
    'Real-Time Crisis Simulation': 'MULTI_STAGE',
    'The Leaked Memo Response Chain': 'MULTI_STAGE',
    'Leaked Memo Response Chain': 'MULTI_STAGE',
    'The Pre-Mortem Red Team': 'WRITTEN_ANALYSIS',
    'Pre-Mortem Red Team': 'WRITTEN_ANALYSIS',
    'Forensic Audit': 'WRITTEN_ANALYSIS',
    'The "Murder Board" Simulation': 'MULTI_STAGE',
    '"Murder Board" Simulation': 'MULTI_STAGE',
    'Murder Board Simulation': 'MULTI_STAGE',
    'Crisis Press Conference': 'MULTI_STAGE'
  }
  
  // Collect all challenge types from taxonomy
  const allTypes = new Set<string>()
  for (const arena of taxonomy.arenas) {
    for (const competency of arena.competencies) {
      if (competency.primaryChallengeType) allTypes.add(competency.primaryChallengeType)
      for (const secondary of competency.secondaryTypes) {
        if (secondary) allTypes.add(secondary)
      }
      for (const blueprint of competency.blueprints) {
        if (blueprint.challengeType) allTypes.add(blueprint.challengeType)
      }
    }
  }
  
  // Map all types
  for (const type of allTypes) {
    if (map[type]) continue // Already mapped
    
    // Try exact match
    if (mappings[type]) {
      map[type] = mappings[type]
      continue
    }
    
    // Try partial match
    const matched = Object.keys(mappings).find(key => 
      type.includes(key) || key.includes(type)
    )
    if (matched) {
      map[type] = mappings[matched]
      continue
    }
    
    // Default fallback based on keywords
    if (type.toLowerCase().includes('negotiation') || type.toLowerCase().includes('redline')) {
      map[type] = 'NEGOTIATION'
    } else if (type.toLowerCase().includes('earnings') || type.toLowerCase().includes('qa')) {
      map[type] = 'EARNINGS_CALL_QA'
    } else if (type.toLowerCase().includes('board') && type.toLowerCase().includes('deck')) {
      map[type] = 'BOARD_DECK_CRITIQUE'
    } else if (type.toLowerCase().includes('financial') || type.toLowerCase().includes('model') || type.toLowerCase().includes('s-1')) {
      map[type] = 'FINANCIAL_MODELING'
    } else if (type.toLowerCase().includes('crisis') || type.toLowerCase().includes('simulation') || type.toLowerCase().includes('chain')) {
      map[type] = 'MULTI_STAGE'
    } else {
      map[type] = 'WRITTEN_ANALYSIS' // Default fallback
    }
  }
  
  return map
}

// Run
try {
  convertBlueprints()
} catch (error) {
  console.error('\n❌ Error:', error)
  process.exit(1)
}

