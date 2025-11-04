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

4. **Decision Stages** (3-4 stages)
   - Stage 1: Immediate action (30 days)
   - Stage 2: Strategic decision (60-90 days)
   - Stage 3: Long-term planning (90-180 days)
   - Stage 4: Final recommendation (optional)
   - For each stage: decision prompt, options/consequences, mapped challenge type

5. **Case Files Needed** (based on blueprint assets)
   - For each asset: specify file type (CSV, Markdown, JSON), approximate content structure
   - Ensure mix: quantitative data, qualitative context, conflicting human input

6. **Evaluation Rubric** (framework step 3)
   - Competencies to test (must include: ${competency.name})
   - Scoring criteria (1-5 scale per competency)
   - Key indicators of strong vs. weak performance

The outline must be structured, specific, and ready for full case generation.`
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
  "description": "[2-3 sentence overview setting the scene]",
  "competencies": ["${competency.name}", ...],
  "estimatedDuration": 120,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "caseFiles": [
    {
      "fileId": "[unique_id]",
      "fileName": "[Name.csv or Name.md]",
      "fileType": "FINANCIAL_DATA" | "MEMO" | "REPORT" | "PRESENTATION_DECK" | "LEGAL_DOCUMENT",
      "source": {
        "type": "STATIC",
        "content": "[CSV data or Markdown content - placeholder for now, will be generated separately]"
      }
    }
  ],
  "stages": [
    {
      "stageId": "[id]",
      "title": "[Stage Title]",
      "description": "[Description]",
      "challengeType": "${mappedLayout}",
      "challengeData": {
        "prompt": "[Decision prompt based on blueprint task]",
        "context": "[Current situation]",
        "options": [
          {
            "id": "[id]",
            "title": "[Option title]",
            "description": "[Description]"
          }
        ]
      }
    }
  ],
  "rubric": {
    "criteria": [
      {
        "competencyName": "${competency.name}",
        "description": "[How this competency is tested]",
        "scoringGuide": {
          "1": "[Poor performance description]",
          "3": "[Average performance description]",
          "5": "[Excellent performance description]"
        }
      }
    ]
  },
  "status": "draft"
}

REQUIREMENTS:
- Include ALL ${blueprint.assets.length} caseFiles from blueprint assets (${blueprint.assets.join(', ')})
- Use placeholder STATIC content for now (will be generated via asset generation)
- Design 3-4 stages with progressively complex decisions
- Each stage's challengeType must be "${mappedLayout}" (internal enum)
- Create detailed rubric with at least 3-4 competencies including ${competency.name}
- Make scenarios realistic and grounded in the blueprint's dilemma
- Ensure central tension is explicit: ${blueprint.dilemma}
- Artifact definition per stage: ${blueprint.task}

${framework.step3}

CRITICAL: Output ONLY valid JSON, no markdown formatting, no explanations. The JSON must be parseable.`
}

/**
 * Build prompt for generating a single case file asset
 */
export function buildAssetGenerationPrompt(
  assetName: string,
  assetType: 'FINANCIAL_DATA' | 'MEMO' | 'REPORT' | 'PRESENTATION_DECK' | 'LEGAL_DOCUMENT',
  blueprint: Blueprint,
  competency: Competency,
  framework: Framework
): string {
  const isFinancial = assetType === 'FINANCIAL_DATA'
  const isMarkdown = !isFinancial
  
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
${isFinancial ? '- Format: CSV with header row' : '- Format: Markdown document'}

${isFinancial ? `
FINANCIAL DATA REQUIREMENTS:
- Create realistic CSV data that supports the blueprint's dilemma
- Include relevant metrics, time periods, and calculations
- Ensure data reveals tensions (some metrics good, others bad)
- Use realistic column names and values
- Include at least 10-20 rows of data
- Example columns: Metric, Q1, Q2, Q3, Q4, Target, Actual, Variance
- Data should be internally consistent

OUTPUT: Valid CSV with header row and data rows.
` : `
DOCUMENT REQUIREMENTS:
- Write from a specific stakeholder's perspective (e.g., CFO, CTO, Head of Sales)
- Create realistic tone and concerns
- Include specific facts, numbers, and observations
- Reveal information that supports the central tension: ${blueprint.dilemma}
- Include conflicting viewpoints or ambiguities
- Make it feel like a real internal document
- Length: 300-800 words for memos/reports

OUTPUT: Well-formatted Markdown document.
`}

The asset must be realistic, detailed, and create the ambiguity needed for the case study. Do not include explanations or markdown code fences - output the raw content only.`
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

