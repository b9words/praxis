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
  
  return `You are an expert business educator creating high-fidelity case study simulations for executive education.

${framework.step1}

${framework.step2}

CURRENT BLUEPRINT:
- Competency: ${competency.name}
- Challenge Type: ${blueprint.challengeType} (maps to layout: ${mappedLayout})
- Title: ${blueprint.title}
- Central Tension (Dilemma): ${blueprint.dilemma}
- User's Task: ${blueprint.task}
- Required Assets: ${blueprint.assets.join(', ')}

YOUR TASK:
Generate a detailed outline for an interactive case study simulation based on this blueprint.

OUTLINE STRUCTURE:
1. **Scenario Setting**
   - Company context (fictionalized name, industry, size, stage)
   - Current situation that anchors the dilemma
   - Timeframe and urgency

2. **Role Definition**
   - Executive role the user plays
   - Authority and constraints
   - Key objectives aligned with the task

3. **Key Stakeholders** (2-4 personas)
   - Name, role, motivations
   - Biases and perspectives that create conflict
   - What they want vs. what's best strategically

4. **Decision Stages** (6-8 stages for HBR-quality depth)
   - Stage 1: Immediate action (30 days) - crisis response or initial decision
   - Stage 2: Information gathering (30-60 days) - data collection and analysis
   - Stage 3: Strategic decision point (60-90 days) - major choice with alternatives
   - Stage 4: Implementation planning (90-120 days) - execution strategy
   - Stage 5: Stakeholder management (120-150 days) - managing resistance/alignment
   - Stage 6: Long-term planning (150-180 days) - sustainability and scaling
   - Stage 7: Final recommendation (180+ days) - comprehensive solution
   - Stage 8: Reflection and learning (optional) - post-decision analysis
   - For each stage: detailed decision prompt, 3-4 options with consequences, mapped challenge type, required artifacts

5. **Case Files Needed** (based on blueprint assets)
   - For each asset: specify file type using the exact enum: FINANCIAL_DATA, MEMO, REPORT, PRESENTATION_DECK, LEGAL_DOCUMENT, ORG_CHART, STAKEHOLDER_PROFILES, MARKET_DATASET, PRESS_RELEASE, or INTERNAL_MEMO
   - Use ORG_CHART for organizational structure JSON
   - Use STAKEHOLDER_PROFILES for stakeholder data JSON
   - Use MARKET_DATASET for time-series or numerical data JSON
   - Use PRESS_RELEASE for public-facing Markdown documents
   - Use INTERNAL_MEMO for internal Markdown communications
   - Ensure mix: quantitative data, qualitative context, conflicting human input

6. **Evaluation Rubric** (framework step 3)
   - Competencies to test (must include: ${competency.name})
   - 8-10 comprehensive criteria covering multiple dimensions
   - 4 performance levels per criterion: Unsatisfactory, Developing, Proficient, Exemplary
   - Specific behavioral descriptors for each level
   - Key indicators of strong vs. weak performance

7. **Data Requirements**
   - Identify at least 3 distinct datasets needed (e.g., financial performance, market trends, HR metrics)
   - Specify time periods (quarterly, monthly, or annual)
   - Define key metrics and units
   - Ensure data reveals tensions and supports decision-making

The outline must be structured, specific, and ready for full case generation with HBR-level depth and completeness.`
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
  
  return `You are an expert business educator creating high-fidelity case study simulations.

${framework.content}

OUTLINE PROVIDED:
${outline}

BLUEPRINT CONTEXT:
- Competency: ${competency.name}
- Challenge Type: ${blueprint.challengeType} (maps to layout enum: ${mappedLayout})
- Title: ${blueprint.title}
- Central Tension: ${blueprint.dilemma}
- Task: ${blueprint.task}

OUTPUT FORMAT:
Generate a valid JSON object with this exact structure:
{
  "caseId": "${caseId}",
  "version": "1.0",
  "title": "[Descriptive Case Title based on blueprint]",
  "description": "[800-1200+ word comprehensive description including: executive summary (100-150 words), company context (200-300 words), current situation and dilemma (200-300 words), decision alternatives and constraints (200-300 words), risks and implications (100-200 words)]",
  "competencies": ["${competency.name}", ...],
  "estimatedDuration": 120,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "caseFiles": [
    {
      "fileId": "[unique_id]",
      "fileName": "[Name.csv or Name.md or Name.json]",
      "fileType": "FINANCIAL_DATA" | "MEMO" | "REPORT" | "PRESENTATION_DECK" | "LEGAL_DOCUMENT" | "ORG_CHART" | "STAKEHOLDER_PROFILES" | "MARKET_DATASET" | "PRESS_RELEASE" | "INTERNAL_MEMO",
      "source": {
        "type": "STATIC",
        "content": ""
      }
    }
  ],
  "stages": [
    {
      "stageId": "[id]",
      "title": "[Stage Title]",
      "description": "[Detailed 150-250 word description of stage context, objectives, and required artifacts]",
      "challengeType": "${mappedLayout}",
      "challengeData": {
        "prompt": "[Comprehensive decision prompt based on blueprint task, 100-200 words]",
        "context": "[Detailed current situation, 150-250 words]",
        "options": [
          {
            "id": "[id]",
            "title": "[Option title]",
            "description": "[Detailed description with pros/cons, 100-150 words]"
          }
        ]
      }
    }
  ],
  "rubric": {
    "criteria": [
      {
        "competencyName": "${competency.name}",
        "description": "[How this competency is tested, 50-100 words]",
        "scoringGuide": {
          "Unsatisfactory": "[Specific behavioral description of poor performance, 50-75 words]",
          "Developing": "[Specific behavioral description of below-average performance, 50-75 words]",
          "Proficient": "[Specific behavioral description of acceptable performance, 50-75 words]",
          "Exemplary": "[Specific behavioral description of excellent performance, 50-75 words]"
        }
      }
    ]
  },
  "datasets": [
    {
      "id": "[dataset_id]",
      "name": "[Dataset Name]",
      "description": "[What this dataset contains]",
      "timePeriod": "[quarterly|monthly|annual]",
      "rows": 16-32,
      "metrics": ["metric1", "metric2", ...],
      "units": {"metric1": "unit", ...}
    }
  ],
  "status": "draft"
}

REQUIREMENTS (HBR-Quality Standards):
- CRITICAL: Include AT MOST 3 caseFiles (select the top 3 highest-value assets from blueprint: ${blueprint.assets.join(', ')})
- Priority order for caseFiles: 1) PRESENTATION_DECK (Marp format), 2) REPORT/INTERNAL_MEMO/MEMO, 3) FINANCIAL_DATA or MARKET_DATASET
- If blueprint has more than 3 assets, prioritize down to the top 3 that provide the best coverage and decision support
- Use empty STATIC content for caseFiles (assets will be generated separately via asset generation endpoint)
- Design 6-8 detailed stages with progressively complex decisions and clear progression
- Each stage's challengeType must be "${mappedLayout}" (internal enum)
- Each stage prompt must be specific, thought-provoking, and demand quantitative reasoning - avoid generic questions like "Analyze the Situation"
- Stage prompts should frame real trade-offs, dilemmas, and require specific quantitative justification
- Description must be 800-1200+ words with clear sections: executive summary, context, dilemma, alternatives, constraints, risks
- Create comprehensive rubric with 8-10 criteria including ${competency.name}, each with 4 performance levels (Unsatisfactory, Developing, Proficient, Exemplary)
- Include AT MOST 3 datasets in the datasets array, each with 16-32 rows of realistic data
- Each stage description must be 150-250 words with detailed context and required artifacts
- Each option description must be 100-150 words with pros/cons and implications
- Make scenarios realistic, detailed, and grounded in the blueprint's dilemma
- Ensure central tension is explicit and drives all stages: ${blueprint.dilemma}
- Artifact definition per stage: ${blueprint.task}
- NO placeholders, NO empty sections, NO "[Placeholder]" text - use real, specific content

${framework.step3}

CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY valid JSON, no markdown formatting, no code fences, no explanations
- The JSON must be parseable and complete
- Description must be 800-1200+ words (enforce this length requirement)
- All text fields must be fully written out, not abbreviated or placeholder
- caseFiles array must contain EXACTLY 3 items (never more, never less) - prioritize from blueprint assets
- datasets array must contain EXACTLY 3 items (never more, never less) - each with complete dataset definitions and realistic schemas
- If blueprint specifies more than 3 assets, select the top 3 highest-priority assets that best support decision-making`
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
  
  // Shared constraints for all asset types
  const sharedConstraints = `CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY the raw content. No code fences (no \`\`\`), no prose outside the required format.
- Do not include placeholders, TODOs, or bracketed text like [Placeholder].
- The output must be immediately usable and renderable without any post-processing.`

  return `You are an expert business analyst creating realistic case study materials for executive education.

${framework.step2}

CONTEXT:
- Blueprint: ${blueprint.title}
- Competency: ${competency.name}
- Central Tension: ${blueprint.dilemma}
- User's Task: ${blueprint.task}

ASSET TO GENERATE:
- Name: ${assetName}
- Type: ${assetType}
${isFinancial ? '- Format: CSV with header row' : isJSON ? '- Format: JSON object/array' : assetType === 'PRESENTATION_DECK' ? '- Format: Marp Markdown presentation' : '- Format: Markdown document'}

${assetType === 'PRESENTATION_DECK' ? `
PRESENTATION DECK REQUIREMENTS (Marp Markdown - HBR Quality):
- Start with Marp frontmatter (required):
  ---
  marp: true
  theme: default
  paginate: true
  ---

- Slides are separated by a single blank-line delimited \`---\` line (not triple dashes, just \`---\` on its own line)
- Create exactly 12-16 slides total for comprehensive coverage
- REQUIRED slide structure (must include all):
  1. Title slide (with presenter name/role, company, date, e.g., "Sarah Chen, CHRO, ScaleGrid Inc., Q3 2024")
  2. Executive Summary (key findings and recommendations)
  3. Agenda/Overview (slide outline)
  4. Context and Background (situation setting)
  5. Problem Statement (core challenge/dilemma)
  6. Alternative 1: [Option Name] (detailed analysis)
  7. Alternative 2: [Option Name] (detailed analysis)
  8. Alternative 3: [Option Name] (detailed analysis, if applicable)
  9. Financial Analysis (with 1-2 charts described in Markdown format, e.g., "Revenue trend: Q1 $2.1M → Q2 $2.3M → Q3 $2.0M")
  10. Risk Assessment (key risks and mitigation)
  11. Stakeholder Impact (who is affected and how)
  12. Recommendation (clear call to action)
  13. Implementation Plan (timeline and milestones)
  14. Next Steps (immediate actions)
  15. Appendix/Supporting Data (if needed)
  16. Q&A or Closing (if needed)

- Each slide must have substantial content: 3-7 bullet points with detailed explanations
- Include specific numbers, metrics, percentages, and realistic business details throughout
- Financial slides must include actual numbers and trends (cite from case datasets when available)
- Align content with the persona/author (e.g., if from CHRO, focus on compensation/HR perspective)
- Make slides professional, executive-level, and presentation-ready
- Total content should be equivalent to 2000-3000 words across all slides

OUTPUT: Raw Marp Markdown with frontmatter and slide separators. No code fences, no explanations.
` : isFinancial ? `
FINANCIAL DATA REQUIREMENTS (HBR Quality):
- Create realistic CSV data that supports the blueprint's dilemma
- Include relevant metrics, time periods, and calculations
- Ensure data reveals tensions (some metrics good, others bad)
- Use realistic column names and values
- Include at least 16 data rows (plus header = 17+ lines total) for comprehensive analysis
- REQUIRED columns (include all relevant): Quarter,Revenue,COGS,GrossMargin%,OperatingExpenses,EBITDA,EBITDA%,CAC,LTV,LTV:CAC,Churn%,Headcount,ARPU,MRR,ARR,Target,Actual,Variance,Variance%
- Data should span multiple time periods (e.g., 4-8 quarters) showing trends
- Data should be internally consistent and realistic (e.g., Revenue - COGS = Gross Margin)
- Include both positive and negative trends to create decision complexity
- No prose, no explanations - ONLY CSV data

OUTPUT: Valid CSV with header row and at least 16 data rows. No code fences, no explanations.
` : isJSON ? `
JSON DATA REQUIREMENTS (HBR Quality):
${assetType === 'ORG_CHART' ? `
- Create an organizational structure with employees, departments, and reporting relationships
- Use this exact structure:
  {
    "title": "[Title for the org chart, e.g., 'ScaleGrid Leadership Team']",
    "summary": "[3-5 sentence overview explaining the organizational structure, key roles, and decision-making hierarchy]",
    "organization": [
      {
        "name": "CEO Name",
        "title": "Chief Executive Officer",
        "department": "Executive",
        "role": "[Executive role]",
        "reportsTo": null,
        "children": [
          {
            "name": "VP Name",
            "title": "VP of Engineering",
            "department": "Engineering",
            "role": "[Management role]",
            "reportsTo": "CEO Name",
            "children": []
          }
        ]
      }
    ],
    "keyTakeaways": [
      "[Key insight about the organizational structure]",
      "[Key insight about reporting relationships or decision-making]",
      "[Key insight about potential bottlenecks or communication challenges]"
    ]
  }
- Include at least 12-20 employees across different levels (C-suite, VPs, Directors, Managers, Individual Contributors)
- Show clear hierarchy and reporting structure using nested "children" arrays
- Include "reportsTo" property for all employees (null for CEO)
- The "keyTakeaways" array should highlight 3-4 critical insights about the organization's structure, decision-making flow, potential bottlenecks, or power dynamics
- Include diverse departments (Engineering, Sales, Marketing, Finance, HR, Operations, etc.)

OUTPUT: Valid JSON object. Output ONLY the JSON, no markdown code fences, no explanations.
` : assetType === 'STAKEHOLDER_PROFILES' ? `
- Create stakeholder profiles with names, roles, concerns, and motivations
- Output MUST be a top-level JSON array (not an object with a "stakeholders" property)
- Include exactly 5-7 stakeholder objects for comprehensive coverage
- Each object must have these REQUIRED fields:
  - name (string): Full name
  - title (string): Job title
  - role (string): Detailed role description (2-3 sentences)
  - power (string): "low" | "medium" | "high" - decision-making authority
  - influence (string): "low" | "medium" | "high" - ability to affect outcomes
  - concerns (array of strings): At least 3-5 concerns, non-empty, specific
  - motivations (array of strings): At least 3-5 motivations, non-empty, specific
  - likely_objections (array of strings): At least 2-3 potential objections to proposals
- Optional fields:
  - department (string)
  - priorities (array of strings)
  - background (string): Brief professional background
- Each stakeholder should have distinct concerns, motivations, and objections that create realistic tension
- Include mix of power levels: 1-2 high power, 2-3 medium power, 1-2 low power
- Example structure: [{"name": "Sarah Chen", "title": "CHRO", "role": "Chief Human Resources Officer responsible for compensation strategy and talent management", "power": "high", "influence": "high", "concerns": ["Budget constraints", "ROI timeline", "Employee retention", "Market competitiveness"], "motivations": ["Cost reduction", "Financial stability", "Talent attraction", "Organizational efficiency"], "likely_objections": ["Too expensive", "Unproven ROI", "Implementation complexity"], "department": "Human Resources"}, ...]

OUTPUT: Valid JSON array (top-level array, not wrapped in object). Output ONLY the JSON, no markdown code fences, no explanations.
` : assetType === 'MARKET_DATASET' ? `
- Create time-series or numerical market data
- Output MUST be a JSON array of objects with a "meta" section
- Structure:
  [
    {"date": "2024-01", "metric1": 1000000, "metric2": 0.15, "metric3": 250},
    {"date": "2024-02", "metric1": 1100000, "metric2": 0.10, "metric3": 275},
    ...
  ]
- Each object must include:
  - A time key: "date", "period", "month", "quarter", or "year" (string, format: "YYYY-MM" or "YYYY-Q1")
  - At least 2-4 numeric metric keys (e.g., revenue, growth, sales, CAC, LTV, market_share, customer_count, etc.)
- Include at least 24 data points (objects in array) for comprehensive trend analysis (e.g., 24 months or 8 quarters)
- Data should show trends, patterns, or tensions relevant to the case
- Include a "meta" object at the end (or as separate field) with units: {"meta": {"metric1": {"unit": "USD", "description": "Monthly revenue"}, "metric2": {"unit": "percentage", "description": "Month-over-month growth"}}}
- Data should reveal both positive and negative trends to create decision complexity
- Example structure: [{"month": "2024-01", "revenue": 1000000, "growth": 0.15, "CAC": 250, "market_share": 0.12}, {"month": "2024-02", "revenue": 1100000, "growth": 0.10, "CAC": 275, "market_share": 0.11}, ...]

OUTPUT: Valid JSON array with at least 24 data points. Output ONLY the JSON, no markdown code fences, no explanations.
` : ''}
` : `
DOCUMENT REQUIREMENTS (HBR Quality):
- Write from a specific stakeholder's perspective (e.g., CFO, CTO, Head of Sales, CEO)
- Create realistic tone and concerns appropriate to the document type
- Include specific facts, numbers, percentages, and observations (cite from case datasets when available)
- Reveal information that supports the central tension: ${blueprint.dilemma}
- Include conflicting viewpoints, ambiguities, and realistic business complexity
- Make it feel like a real executive-level document
- Minimum length: 900-1500 words for comprehensive coverage
- Must include at least 5 headings (using # or ##) with detailed subsections
- REQUIRED sections (adapt based on document type):
  - Executive Summary (100-150 words)
  - Background/Context (200-300 words)
  - Current Situation/Analysis (200-300 words)
  - Key Findings/Issues (200-300 words)
  - Recommendations/Next Steps (150-200 words)
  - Conclusion (100-150 words)
- For INTERNAL_MEMO: Internal communication tone, urgent/action-oriented, includes specific data points
- For REPORT: Analytical, data-driven, formal, includes charts/figures described in text
- For PRESS_RELEASE: Public-facing, professional, newsworthy, includes quotes and company statements
- For LEGAL_DOCUMENT: Formal legal language, structured sections, includes clauses and provisions
- NO placeholders, NO "[Placeholder]" text - use real, specific content throughout

OUTPUT: Well-formatted Markdown document with headings and comprehensive content (900-1500 words). No code fences, no explanations.
`}

${sharedConstraints}

The asset must be realistic, detailed, and create the ambiguity needed for the case study.`
}

/**
 * Build prompt for generating scoring rubric
 */
export function buildRubricPrompt(
  competency: Competency,
  blueprint: Blueprint,
  framework: Framework
): string {
  return `${framework.step3}

COMPETENCY TO ASSESS: ${competency.name}
CASE CONTEXT: ${blueprint.title}
CENTRAL TENSION: ${blueprint.dilemma}
USER'S TASK: ${blueprint.task}

Generate a detailed scoring rubric with:
1. Primary competency: ${competency.name} (must be included)
2. 2-3 additional relevant competencies
3. For each competency, scoring guide:
   - Score 1: Poor performance (what bad looks like)
   - Score 3: Average performance (what acceptable looks like)
   - Score 5: Excellent performance (what great looks like)

The rubric must directly measure the target skill and align with the blueprint's task.`
}

