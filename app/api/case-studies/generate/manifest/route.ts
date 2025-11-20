// Dynamic import for script utilities (using file system path)
async function getGenerationUtils() {
  const scriptPath = path.join(process.cwd(), 'execemy', 'scripts', 'generate-shared.ts')
  const module = await import(scriptPath)
  return { generateWithAI: module.generateWithAI, getCoreValuesPrompt: module.getCoreValuesPrompt }
}

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * API route for Phase 1: Generate case study manifest
 * POST /api/case-studies/generate/manifest
 */
export async function POST(request: NextRequest) {
  try {
    
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { topic, caseId } = body

    if (!topic || !caseId) {
      return NextResponse.json(
        { error: 'topic and caseId are required' },
        { status: 400 }
      )
    }

    const { generateWithAI, getCoreValuesPrompt } = await getGenerationUtils()
    const coreValues = getCoreValuesPrompt()

    const prompt = `You are a senior analyst preparing a case study for executive education.

TOPIC: ${topic}

Generate a Case File Manifest (JSON) listing 5-7 real-world documents essential for understanding this business decision.

For each document:
1. fileId (unique, e.g., 'financials_2017')
2. fileName (descriptive, e.g., 'Disney_Media_Networks_Financials_2017.csv')
3. fileType: 'SEC_FILING_TABLE', 'ANALYST_REPORT_SNAPSHOT', 'INTERNAL_MEMO_SYNTHESIS', 'MARKET_DATA_CHART', 'PRESENTATION_DECK', 'LEGAL_DOCUMENT', 'CUSTOMER_FEEDBACK_DATA'
4. sourcingGuide: Specific keywords, exact URLs (sec.gov/edgar/search), table names, section refs, step-by-step extraction instructions
5. synthesisInstruction: How evidence integrates into case narrative, strategic insights, competency relevance, relevant stage, executive takeaways

OUTPUT (valid JSON only):
{
  "caseId": "${caseId}",
  "topic": "${topic}",
  "files": [{"fileId": "financials_2017", "fileName": "Company_Financials_2017.csv", "fileType": "SEC_FILING_TABLE", "sourcingGuide": "...", "synthesisInstruction": "..."}]
}

REQUIREMENTS:
- 5-7 files (aim for 6-7). Mix: 2+ financial sources, 1-2 analyst/market reports, 1-2 internal memos/strategic docs, 1 operational/customer data (optional)
- sourcingGuide: Exact URLs, table/section names, search keywords, extraction/formatting steps
- synthesisInstruction: Strategic importance, decision-relevance, competency links, stage relevance, executive insights

${coreValues}

QUALITY: Realistic, real-world scenarios. Financial data spans multiple periods. Mix quantitative/qualitative. Enough info for decisions. Reveal conflicts/multiple perspectives.

OUTPUT: ONLY valid JSON, no markdown/explanations.`

    const systemPrompt = 'You are a senior analyst at a top-tier consulting firm. Create detailed, actionable research manifests for executive education case studies.'

    const result = await generateWithAI(prompt, systemPrompt)
    let manifestStr = result.content

    // Clean JSON
    manifestStr = manifestStr.trim()
    if (manifestStr.startsWith('```json')) {
      manifestStr = manifestStr.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (manifestStr.startsWith('```')) {
      manifestStr = manifestStr.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    // Parse JSON
    let manifest: any
    try {
      manifest = JSON.parse(manifestStr)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse manifest JSON', details: String(error) },
        { status: 500 }
      )
    }

    // Ensure caseId matches
    manifest.caseId = caseId
    manifest.topic = topic

    // Validate
    if (!manifest.files || !Array.isArray(manifest.files) || manifest.files.length < 5) {
      return NextResponse.json(
        { error: `Invalid manifest: need at least 5 files, got ${manifest.files?.length || 0}` },
        { status: 500 }
      )
    }

    // Save manifest
    const sourcesDir = path.join(process.cwd(), 'execemy', 'content', 'sources')
    if (!fs.existsSync(sourcesDir)) {
      fs.mkdirSync(sourcesDir, { recursive: true })
    }

    const manifestPath = path.join(sourcesDir, `${caseId}-manifest.json`)
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')

    return NextResponse.json({
      success: true,
      manifest,
      manifestPath: `content/sources/${caseId}-manifest.json`,
      nextSteps: {
        phase2: `Create directory: content/sources/${caseId}`,
        phase3: `Run assembly after sourcing all files`
      }
    })
  } catch (error) {
    console.error('Manifest generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

