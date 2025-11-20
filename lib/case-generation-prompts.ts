/**
 * Prompt builders for case study generation
 * 
 * These functions build prompts following the Crucible Framework and reference taxonomy.
 */

import fs from 'fs'
import path from 'path'

interface Framework {
  title: string
  content: string
  step1: string
  step2: string
  step3: string
}

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

/**
 * Load framework from JSON
 */
function loadFramework(): Framework {
  const frameworkPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'framework.json')
  const frameworkContent = fs.readFileSync(frameworkPath, 'utf-8')
  return JSON.parse(frameworkContent) as Framework
}

/**
 * Load challenge type map
 */
function loadChallengeTypeMap(): Record<string, string> {
  const mapPath = path.join(process.cwd(), 'content', 'cases', 'taxonomy', 'challenge-type-map.json')
  const mapContent = fs.readFileSync(mapPath, 'utf-8')
  return JSON.parse(mapContent) as Record<string, string>
}

/**
 * Build prompt for generating case study outline from blueprint
 */
export function buildCaseOutlinePrompt(blueprint: Blueprint, competency: Competency, framework: Framework): string {
  const challengeTypeMap = loadChallengeTypeMap()
  const mappedLayout = challengeTypeMap[blueprint.challengeType] || 'WRITTEN_ANALYSIS'
  
  return `You are an expert business educator creating case study simulations for executive education.

${framework.step1}

${framework.step2}

BLUEPRINT:
- Competency: ${competency.name}
- Challenge Type: ${blueprint.challengeType} (layout: ${mappedLayout})
- Title: ${blueprint.title}
- Dilemma: ${blueprint.dilemma}
- Task: ${blueprint.task}
- Assets: ${blueprint.assets.join(', ')}

Generate a detailed outline for an interactive case study simulation.

OUTLINE STRUCTURE:
1. **Scenario Setting**: Company context (name, industry, size, stage), current situation, timeframe, urgency
2. **Role Definition**: Executive role, authority/constraints, objectives aligned with task
3. **Key Stakeholders** (2-4): Name, role, motivations, biases creating conflict, strategic vs. personal wants
4. **Decision Stages** (6-8): Stage 1 (30d - crisis), Stage 2 (30-60d - info gathering), Stage 3 (60-90d - strategic choice), Stage 4 (90-120d - implementation), Stage 5 (120-150d - stakeholder mgmt), Stage 6 (150-180d - long-term), Stage 7 (180+d - recommendation), Stage 8 (optional - reflection). For each: decision prompt, 3-4 options with consequences, challenge type, artifacts
5. **Case Files**: For each asset, specify file type enum: FINANCIAL_DATA, MEMO, REPORT, PRESENTATION_DECK, LEGAL_DOCUMENT, ORG_CHART, STAKEHOLDER_PROFILES, MARKET_DATASET, PRESS_RELEASE, INTERNAL_MEMO. Mix: quantitative data, qualitative context, conflicting perspectives
6. **Evaluation Rubric** (${framework.step3}): Competencies including ${competency.name}, 8-10 criteria, 4 levels (Unsatisfactory, Developing, Proficient, Exemplary) with behavioral descriptors
7. **Data Requirements**: 3+ distinct datasets (financial, market, HR, etc.), time periods (quarterly/monthly/annual), key metrics/units, data revealing tensions

The outline must be structured and ready for full case generation.`
}

/**
 * Build prompt for generating full case study JSON from outline
 */
export function buildCaseGenerationPrompt(
  outline: string,
  blueprint: Blueprint,
  competency: Competency,
  framework: Framework,
  caseId: string
): string {
  const challengeTypeMap = loadChallengeTypeMap()
  const mappedLayout = challengeTypeMap[blueprint.challengeType] || 'WRITTEN_ANALYSIS'
  
  return `You are an expert business educator creating case study simulations.

${framework.content}

OUTLINE:
${outline}

BLUEPRINT:
- Competency: ${competency.name}
- Challenge Type: ${blueprint.challengeType} (layout: ${mappedLayout})
- Title: ${blueprint.title}
- Dilemma: ${blueprint.dilemma}
- Task: ${blueprint.task}

OUTPUT FORMAT (valid JSON only):
{
  "caseId": "${caseId}",
  "version": "1.0",
  "title": "[Descriptive Case Title]",
  "description": "[800-1200 words: executive summary (100-150), company context (200-300), situation/dilemma (200-300), alternatives/constraints (200-300), risks (100-200)]",
  "competencies": ["${competency.name}", ...],
  "estimatedDuration": 120,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "caseFiles": [{"fileId": "[id]", "fileName": "[Name.csv|md|json]", "fileType": "FINANCIAL_DATA|MEMO|REPORT|PRESENTATION_DECK|LEGAL_DOCUMENT|ORG_CHART|STAKEHOLDER_PROFILES|MARKET_DATASET|PRESS_RELEASE|INTERNAL_MEMO", "source": {"type": "STATIC", "content": ""}}],
  "stages": [{"stageId": "[id]", "title": "[Title]", "description": "[150-250 words]", "challengeType": "${mappedLayout}", "challengeData": {"prompt": "[100-200 words]", "context": "[150-250 words]", "options": [{"id": "[id]", "title": "[Title]", "description": "[100-150 words with pros/cons]"}]}}],
  "rubric": {"criteria": [{"competencyName": "${competency.name}", "description": "[50-100 words]", "scoringGuide": {"Unsatisfactory": "[50-75 words]", "Developing": "[50-75 words]", "Proficient": "[50-75 words]", "Exemplary": "[50-75 words]"}}]},
  "datasets": [{"id": "[id]", "name": "[Name]", "description": "[What it contains]", "timePeriod": "quarterly|monthly|annual", "rows": 16-32, "metrics": ["metric1", ...], "units": {"metric1": "unit"}}],
  "status": "draft"
}

REQUIREMENTS:
- EXACTLY 3 caseFiles (priority: 1) PRESENTATION_DECK, 2) REPORT/INTERNAL_MEMO/MEMO, 3) FINANCIAL_DATA/MARKET_DATASET). Use empty STATIC content.
- 6-8 stages with progressive complexity. Each challengeType="${mappedLayout}". Stage prompts: specific, quantitative, trade-offs (not generic "Analyze").
- Description: 800-1200 words (exec summary, context, dilemma, alternatives, constraints, risks).
- Rubric: 8-10 criteria including ${competency.name}, 4 levels each (Unsatisfactory, Developing, Proficient, Exemplary).
- EXACTLY 3 datasets, 16-32 rows each, realistic data.
- Stage descriptions: 150-250 words. Option descriptions: 100-150 words with pros/cons.
- Grounded in dilemma: ${blueprint.dilemma}. Task: ${blueprint.task}.
- NO placeholders, NO "[Placeholder]" text.

${framework.step3}

OUTPUT: ONLY valid JSON, no markdown, no code fences, no explanations. Parseable and complete.`
}

/**
 * Build prompt for generating a single case file asset
 */
export function buildAssetGenerationPrompt(
  assetName: string,
  assetType: 'FINANCIAL_DATA' | 'MEMO' | 'REPORT' | 'PRESENTATION_DECK' | 'LEGAL_DOCUMENT' | 'ORG_CHART' | 'STAKEHOLDER_PROFILES' | 'MARKET_DATASET' | 'PRESS_RELEASE' | 'INTERNAL_MEMO',
  blueprint: Blueprint,
  competency: Competency,
  framework: Framework
): string {
  const isFinancial = assetType === 'FINANCIAL_DATA'
  const isJSON = assetType === 'ORG_CHART' || assetType === 'STAKEHOLDER_PROFILES' || assetType === 'MARKET_DATASET'
  const isMarkdown = !isFinancial && !isJSON
  
  const sharedConstraints = `OUTPUT: Raw content only. No code fences (\`\`\`), no prose, no placeholders. Immediately usable.`

  return `You are an expert business analyst creating realistic case study materials.

${framework.step2}

CONTEXT: Blueprint: ${blueprint.title} | Competency: ${competency.name} | Dilemma: ${blueprint.dilemma} | Task: ${blueprint.task}

ASSET: ${assetName} (${assetType}) | Format: ${isFinancial ? 'CSV' : isJSON ? 'JSON' : assetType === 'PRESENTATION_DECK' ? 'Marp Markdown' : 'Markdown'}

${assetType === 'PRESENTATION_DECK' ? `
PRESENTATION DECK (Marp):
- Frontmatter: ---\nmarp: true\ntheme: default\npaginate: true\n---
- Slides separated by \`---\` on own line. 12-16 slides total.
- Required slides: 1) Title (presenter/role/company/date), 2) Executive Summary, 3) Agenda, 4) Context/Background, 5) Problem Statement, 6-8) Alternatives 1-3, 9) Financial Analysis (with numbers/trends), 10) Risk Assessment, 11) Stakeholder Impact, 12) Recommendation, 13) Implementation Plan, 14) Next Steps, 15-16) Appendix/Q&A (optional)
- Each slide: 3-7 bullets with details. Include numbers/metrics. Align with persona. 2000-3000 words total.
` : isFinancial ? `
FINANCIAL DATA (CSV):
- Realistic CSV supporting dilemma. Tensions (some metrics good/bad). 16+ data rows (17+ lines with header).
- Columns: Quarter,Revenue,COGS,GrossMargin%,OperatingExpenses,EBITDA,EBITDA%,CAC,LTV,LTV:CAC,Churn%,Headcount,ARPU,MRR,ARR,Target,Actual,Variance,Variance%
- 4-8 quarters showing trends. Internally consistent. Positive/negative trends. CSV only, no prose.
` : isJSON ? `
JSON DATA:
${assetType === 'ORG_CHART' ? `
- Structure: {"title": "[Title]", "summary": "[3-5 sentences]", "organization": [{"name": "CEO", "title": "CEO", "department": "Executive", "role": "[role]", "reportsTo": null, "children": [...]}], "keyTakeaways": ["[insight]", ...]}
- 12-20 employees (C-suite, VPs, Directors, Managers, ICs). Nested "children" arrays. "reportsTo" for all (null for CEO). 3-4 keyTakeaways on structure/bottlenecks/power. Diverse departments.
` : assetType === 'STAKEHOLDER_PROFILES' ? `
- Top-level JSON array (not object). 5-7 stakeholders.
- Required fields: name, title, role (2-3 sentences), power ("low"|"medium"|"high"), influence ("low"|"medium"|"high"), concerns (3-5 strings), motivations (3-5 strings), likely_objections (2-3 strings). Optional: department, priorities, background.
- Mix: 1-2 high power, 2-3 medium, 1-2 low. Distinct concerns/motivations creating tension.
` : assetType === 'MARKET_DATASET' ? `
- JSON array: [{"date": "2024-01", "metric1": 1000000, "metric2": 0.15, ...}, ...]
- Each object: time key ("date"/"period"/"month"/"quarter"/"year", format "YYYY-MM" or "YYYY-Q1"), 2-4 numeric metrics (revenue, growth, CAC, LTV, market_share, etc.)
- 24+ data points (24 months or 8 quarters). Show trends/tensions. Include "meta" with units: {"meta": {"metric1": {"unit": "USD", "description": "..."}}}
` : ''}
` : `
DOCUMENT (Markdown):
- Stakeholder perspective (CFO/CTO/Head of Sales/CEO). Realistic tone. 900-1500 words. 5+ headings (# or ##).
- Sections: Executive Summary (100-150), Background (200-300), Current Situation (200-300), Key Findings (200-300), Recommendations (150-200), Conclusion (100-150)
- INTERNAL_MEMO: Urgent, action-oriented, data points. REPORT: Analytical, formal, charts in text. PRESS_RELEASE: Public, newsworthy, quotes. LEGAL_DOCUMENT: Formal, clauses.
- Include numbers, support dilemma: ${blueprint.dilemma}, conflicting viewpoints, real complexity. NO placeholders.
`}

${sharedConstraints}`
}


