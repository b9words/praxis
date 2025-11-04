import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  buildCaseOutlinePrompt,
  buildCaseGenerationPrompt,
} from '@/lib/case-generation-prompts'
import {
  uploadToStorage,
  syncFileMetadata,
  generateAndUploadThumbnail,
  isSupabaseAvailable,
  generateWithAI,
} from '@/scripts/generate-shared'

export const runtime = 'nodejs'

interface GenerationOptions {
  provider: 'openai' | 'gemini'
  model: string
  includeVisualizations?: boolean
  includeMermaidDiagrams?: boolean
  targetWordCount?: number
  tone?: 'professional' | 'academic' | 'conversational'
}

interface GenerateCaseRequest {
  arenaId: string
  competencyName: string
  blueprintId?: string
  blueprintTitle?: string
  options: GenerationOptions
  caseId?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration?: number
}

/**
 * POST /api/content-generation/generate-case
 * Generate a case study from a blueprint
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateCaseRequest = await request.json()
    const {
      arenaId,
      competencyName,
      blueprintId,
      blueprintTitle,
      options,
      caseId,
      difficulty,
      estimatedDuration,
    } = body

    if (!arenaId || !competencyName || (!blueprintId && !blueprintTitle) || !options) {
      return NextResponse.json(
        { error: 'Missing required fields: arenaId, competencyName, blueprintId or blueprintTitle, options' },
        { status: 400 }
      )
    }

    // Load taxonomy
    const taxonomyPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'arenas.json')
    if (!fs.existsSync(taxonomyPath)) {
      return NextResponse.json(
        { error: 'Taxonomy not found. Run scripts/convert-case-blueprints.ts first.' },
        { status: 500 }
      )
    }

    const taxonomyContent = fs.readFileSync(taxonomyPath, 'utf-8')
    const taxonomy = JSON.parse(taxonomyContent)

    // Find arena, competency, and blueprint
    const arena = taxonomy.arenas.find((a: any) => a.id === arenaId)
    if (!arena) {
      return NextResponse.json({ error: `Arena ${arenaId} not found` }, { status: 404 })
    }

    const competency = arena.competencies.find(
      (c: any) => c.name === competencyName || c.name.includes(competencyName)
    )
    if (!competency) {
      return NextResponse.json(
        { error: `Competency "${competencyName}" not found in ${arenaId}` },
        { status: 404 }
      )
    }

    const blueprint = blueprintId
      ? competency.blueprints.find((b: any) => b.id === blueprintId)
      : competency.blueprints.find((b: any) => b.title === blueprintTitle || b.title.includes(blueprintTitle || ''))

    if (!blueprint) {
      return NextResponse.json(
        { error: `Blueprint ${blueprintId || blueprintTitle} not found` },
        { status: 404 }
      )
    }

    // Load framework
    const frameworkPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'framework.json')
    const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
    const framework = JSON.parse(frameworkContent)

    // Step 1: Generate outline
    const outlinePrompt = buildCaseOutlinePrompt(blueprint, competency, framework)
    const outlineResult = await generateWithAI(
      outlinePrompt,
      'You are an expert business educator specializing in executive case study design.',
      { trackUsage: true }
    )

    // Step 2: Generate full case JSON
    const finalCaseId = caseId || `cs_${blueprint.id}_${Date.now()}`
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

    // Parse JSON (clean markdown code blocks if present)
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
      console.error('Failed to parse case JSON:', parseError)
      console.error('Raw output (first 500 chars):', caseJsonStr.substring(0, 500))
      return NextResponse.json(
        { error: 'Invalid JSON generated', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // Apply overrides
    if (difficulty) caseData.difficulty = difficulty
    if (estimatedDuration) caseData.estimatedDuration = estimatedDuration
    caseData.status = 'draft'
    caseData.caseId = finalCaseId

    // Validate minimum requirements
    if (!caseData.caseFiles || !Array.isArray(caseData.caseFiles) || caseData.caseFiles.length < 3) {
      return NextResponse.json(
        { error: 'Generated case must have at least 3 caseFiles' },
        { status: 500 }
      )
    }

    if (!caseData.stages || !Array.isArray(caseData.stages) || caseData.stages.length < 3) {
      return NextResponse.json(
        { error: 'Generated case must have at least 3 stages' },
        { status: 500 }
      )
    }

    // Save to local data directory first (for list-assets API)
    const dataDir = path.join(process.cwd(), 'data', 'case-studies')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const localCasePath = path.join(dataDir, `${finalCaseId}.json`)
    fs.writeFileSync(localCasePath, JSON.stringify(caseData, null, 2), 'utf-8')

    // Upload to storage
    const storagePath = `cases/year1/${arenaId.toLowerCase()}/${competency.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}/${finalCaseId}.json`
    const caseJsonFinal = JSON.stringify(caseData, null, 2)
    
    await uploadToStorage(storagePath, caseJsonFinal, 'application/json')

    // Sync metadata (non-blocking - failures are logged but don't stop generation)
    let syncResult: any = null
    try {
      syncResult = await syncFileMetadata(storagePath)
      // If sync was skipped or failed, log but continue
      if (syncResult && !syncResult.success && syncResult.skipped) {
        console.warn('Metadata sync skipped:', syncResult.message || syncResult.error)
      }
    } catch (syncError) {
      console.warn('Metadata sync failed:', syncError)
    }

    // Generate thumbnail
    let thumbnailUrl: string | null = null
    const dbCaseId = syncResult?.case_id || syncResult?.article_id // Handle both cases and articles
    if (dbCaseId && isSupabaseAvailable()) {
      try {
        await generateAndUploadThumbnail(
          dbCaseId,
          'case',
          caseData.title,
          arena.theme,
          competency.name
        )
      } catch (thumbError) {
        console.warn('Thumbnail generation failed:', thumbError)
      }
    }

    return NextResponse.json({
      case: caseData,
      storagePath,
      caseId: dbCaseId || finalCaseId,
      thumbnailUrl,
      // Include full case data for saving to DB
      caseData: {
        title: caseData.title,
        description: caseData.description || caseData.briefing?.overview || '',
        rubric: caseData.rubric || {},
        briefingDoc: null, // Content is in storage
        datasets: caseData.datasets || null,
        storagePath,
        difficulty: caseData.difficulty || 'intermediate',
        estimatedMinutes: caseData.estimatedDuration || 60,
        prerequisites: caseData.prerequisites || [],
        metadata: {
          competencies: caseData.competencies || [],
          persona: caseData.persona || {},
          arenaId,
          competencyName: competency.name,
          blueprintId,
          ...caseData.metadata,
        },
        status: caseData.status || 'draft',
      },
    })
  } catch (error) {
    console.error('Error generating case:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate case',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

