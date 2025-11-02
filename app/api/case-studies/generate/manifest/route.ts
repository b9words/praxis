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

    const prompt = `You are a senior analyst at a top-tier consulting firm preparing a comprehensive case study for an executive education program. 

TOPIC: **'${topic}'**

Generate a **'Case File Manifest'** that will form the foundation of this case study. This manifest must be a JSON object listing 5-7 specific, real-world documents that are essential for understanding this business decision and testing executive competencies.

For each document, provide:
1. A unique \`fileId\` (e.g., 'financials_2017', 'market_analysis_q3', 'board_presentation').
2. A descriptive \`fileName\` that clearly identifies the document (e.g., 'Disney_Media_Networks_Financials_2017.csv', 'Market_Share_Analysis_Q3_2023.pdf').
3. A \`fileType\` from: 'SEC_FILING_TABLE', 'ANALYST_REPORT_SNAPSHOT', 'INTERNAL_MEMO_SYNTHESIS', 'MARKET_DATA_CHART', 'PRESENTATION_DECK', 'LEGAL_DOCUMENT', 'CUSTOMER_FEEDBACK_DATA'.
4. A detailed \`sourcingGuide\` with specific keywords, exact URLs (like sec.gov/edgar/search), table names, section references, and step-by-step instructions for finding this data.
5. A \`synthesisInstruction\` explaining how this evidence piece should be integrated into the final case narrative and what strategic insights it provides.

OUTPUT FORMAT (valid JSON only):
{
  "caseId": "${caseId}",
  "topic": "${topic}",
  "files": [
    {
      "fileId": "financials_2017",
      "fileName": "Company_Financials_2017.csv",
      "fileType": "SEC_FILING_TABLE",
      "sourcingGuide": "Go to SEC EDGAR database (sec.gov/edgar). Search for the company's 10-K filing for 2017. Locate the 'Segment Information' table in the financial statements. Extract the table and save as CSV with these specific columns: [list columns].",
      "synthesisInstruction": "Use this data to quantify the revenue streams that would be impacted by the decision. Highlight the margin differences between segments."
    }
  ]
}

REQUIREMENTS:
- Include 5-7 files total (aim for 6-7 to ensure comprehensive coverage)
- Mix of file types: 
  * At least 2 financial data sources (income statements, balance sheets, segment data, cash flow)
  * 1-2 analyst reports or market research data
  * 1-2 internal memos, communications, or strategic documents
  * 1 operational or customer data source (optional but recommended)
- Each sourcingGuide must be extremely specific and actionable:
  * Include exact URLs (sec.gov/edgar/search, company investor relations pages, industry databases)
  * Specify exact table names, section numbers, or document locations
  * Provide search keywords and filters
  * Include instructions for data extraction and formatting
- Each synthesisInstruction should:
  * Explain the strategic importance and decision-relevance of this evidence
  * Describe how it relates to key competencies being tested
  * Indicate which stage of the case this data is most relevant for
  * Highlight what insights executives should draw from this evidence

${coreValues}

QUALITY STANDARDS:
- Documents should be realistic and based on real-world business scenarios
- Financial data should span multiple time periods to show trends
- Mix quantitative data with qualitative context (memos, reports)
- Ensure documents collectively provide enough information for meaningful decision-making
- Documents should reveal conflicting information or multiple perspectives when appropriate

CRITICAL: Output ONLY valid JSON, no markdown formatting, no explanations. The JSON must be parseable.`

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

