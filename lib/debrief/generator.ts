/**
 * Debrief Generator
 * Generates AI-powered debriefs for completed simulations
 */

import type { UserDecision } from '@/types/case-study.types'

export interface DebriefResult {
  scores: Array<{
    competencyName: string
    score: number
    justification: string
    strength?: string
    weakness?: string
    actionableAdvice?: string
  }>
  radarChartData: {
    financialAcumen: number
    strategicThinking: number
    marketAwareness: number
    riskManagement: number
    leadershipJudgment: number
  }
  summaryText: string
  keyInsight: string
  goldStandardExemplar?: string
}

interface SimulationData {
  id: string
  userId: string
  caseId: string
  userInputs: any
  case: {
    id: string
    title: string
    rubric: any
    competencies?: Array<{
      competency: {
        id: string
        name: string
      }
    }>
  }
}

/**
 * Extract decisions from simulation userInputs
 */
function extractDecisions(userInputs: any): UserDecision[] {
  if (!userInputs || typeof userInputs !== 'object') return []
  
  // Try to get decisions from stageStates.simulationState.decisions
  const stageStates = userInputs.stageStates || {}
  const simulationState = stageStates.simulationState || {}
  if (Array.isArray(simulationState.decisions)) {
    return simulationState.decisions
  }
  
  // Fallback: try direct decisions array
  if (Array.isArray(userInputs.decisions)) {
    return userInputs.decisions
  }
  
  return []
}

/**
 * Map competency names to radar chart keys
 */
function mapCompetencyToRadarKey(competencyName: string): keyof DebriefResult['radarChartData'] | null {
  const normalized = competencyName.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  if (normalized.includes('financial') || normalized.includes('acumen')) {
    return 'financialAcumen'
  }
  if (normalized.includes('strategic') || normalized.includes('thinking')) {
    return 'strategicThinking'
  }
  if (normalized.includes('market') || normalized.includes('awareness')) {
    return 'marketAwareness'
  }
  if (normalized.includes('risk') || normalized.includes('management')) {
    return 'riskManagement'
  }
  if (normalized.includes('leadership') || normalized.includes('judgment')) {
    return 'leadershipJudgment'
  }
  
  return null
}

/**
 * Generate debrief for a completed simulation
 */
export async function generateDebrief(simulation: SimulationData): Promise<DebriefResult> {
  if (typeof window !== 'undefined') {
    throw new Error('generateDebrief can only be called server-side')
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest'

  // Extract user decisions
  const decisions = extractDecisions(simulation.userInputs)
  
  // Check for nonsense inputs before processing
  const detectNonsense = (justifications: string[]): boolean => {
    if (justifications.length === 0) return true
    
    const allText = justifications.join(' ').trim()
    if (allText.length < 50) return true
    
    // Check word count
    const words = allText.split(/\s+/).filter(w => w.length > 0)
    if (words.length < 8) return true
    
    // Check for repeated characters
    if (/(.)\1{4,}/.test(allText)) return true
    
    // Check for meaningful content (at least 30% alphabetic)
    const alphaChars = allText.match(/[a-zA-Z]/g)?.length || 0
    const alphaRatio = alphaChars / allText.length
    if (alphaRatio < 0.3) return true
    
    // Check for unique words (at least 50% unique)
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    const uniqueRatio = uniqueWords.size / words.length
    if (uniqueRatio < 0.5 && words.length > 10) return true
    
    return false
  }
  
  const justifications = decisions.map(d => d.justification || '').filter(Boolean)
  const isNonsense = detectNonsense(justifications)
  
  // If nonsense detected, return low scores without AI call
  if (isNonsense) {
    const competencyNames = simulation.case.competencies?.map(cc => cc.competency.name) || 
      Object.keys(simulation.case.rubric?.criteria || {}) || 
      ['Strategic Thinking', 'Financial Acumen', 'Risk Management', 'Market Awareness', 'Leadership Judgment']
    
    return {
      scores: competencyNames.map(name => ({
        competencyName: name,
        score: 1.0,
        justification: 'The provided analysis lacks sufficient detail and meaningful content to assess this competency. Please provide a more thorough justification with specific reasoning.',
        strength: undefined,
        weakness: 'The analysis provided was too brief or lacked substantive content to demonstrate competency in this area.',
        actionableAdvice: 'To improve, provide detailed justifications that explain your reasoning, reference specific data or frameworks, and demonstrate your analytical thinking process.',
      })),
      summaryText: 'Your submission did not contain sufficient detail to provide a meaningful assessment. To receive feedback, please provide detailed justifications that explain your reasoning and demonstrate your analytical thinking.',
      keyInsight: 'Your submission needs more detail to provide meaningful feedback.',
      radarChartData: {
        financialAcumen: 1.0,
        strategicThinking: 1.0,
        marketAwareness: 1.0,
        riskManagement: 1.0,
        leadershipJudgment: 1.0,
      },
      goldStandardExemplar: undefined,
    }
  }
  
  const decisionsText = decisions
    .map((d, idx) => {
      let text = `Decision ${idx + 1}:\n`
      if (d.selectedOption) text += `Selected Option: ${d.selectedOption}\n`
      text += `Justification: ${d.justification}\n`
      if (d.rolePlayTranscript && d.rolePlayTranscript.length > 0) {
        text += `Role Play: ${d.rolePlayTranscript.map(t => `${t.role}: ${t.message}`).join('\n')}\n`
      }
      return text
    })
    .join('\n---\n\n')

  // Extract rubric criteria
  const rubric = simulation.case.rubric || {}
  const criteria = Object.entries(rubric.criteria || {}).map(([key, value]: [string, any]) => ({
    name: key,
    description: value.description || '',
    scoring: value.scoring || {},
    weight: value.weight || 1,
  }))

  // Get competency names from case or rubric
  const competencyNames = simulation.case.competencies?.map(cc => cc.competency.name) || 
    criteria.map(c => c.name) || 
    ['Strategic Thinking', 'Financial Acumen', 'Risk Management', 'Market Awareness', 'Leadership Judgment']

  // Build prompt for comprehensive debrief
  const debriefPrompt = `You are an expert executive coach debriefing a case study simulation.

CASE: ${simulation.case.title}
DECISIONS: ${decisionsText || 'No decisions provided.'}
CRITERIA: ${criteria.map(c => `- ${c.name}: ${c.description}`).join('\n')}
COMPETENCIES: ${competencyNames.join(', ')}

For EACH competency, provide:
1. Score (1-5): Based on decisions/analysis
2. Strength: Quote user's words, specific positive observation
3. Weakness: Quote or point to omission, constructive criticism
4. Actionable Advice: Concrete next step, reference lesson/framework

Also provide:
- Key Insight: One powerful sentence (the "aha!" moment)
- Summary Text: 2-3 paragraph executive summary

OUTPUT (JSON):
{
  "scores": [{"competencyName": "Strategic Thinking", "score": 4, "justification": "...", "strength": "You wrote: '[quote]'. This shows...", "weakness": "However, you didn't address [gap].", "actionableAdvice": "Review lesson '[Title]' for [skill]."}],
  "keyInsight": "[One powerful sentence]",
  "summaryText": "[2-3 paragraphs]"
}

REQUIREMENTS:
- Quote actual user phrases
- Be specific, not generic
- Scores reflect rubric criteria
- Include all tested competencies
- Key insight: memorable and actionable`

  try {
    // Generate debrief using Gemini
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: debriefPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json',
          }
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      throw new Error(`Gemini API request failed: ${geminiResponse.status} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    const debriefResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!debriefResponse) {
      throw new Error('No response from Gemini API')
    }
    
    // Parse JSON response (Gemini returns pure JSON when responseMimeType is set)
    let debriefJson: any
    try {
      // Since we set responseMimeType: 'application/json', the response should be pure JSON
      // But sometimes it might still be wrapped, so try direct parse first, then extract if needed
      let jsonText = debriefResponse.trim()
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim()
        }
      }
      
      // Parse the JSON
      debriefJson = JSON.parse(jsonText)
      
      // Validate required fields
      if (!debriefJson.scores || !Array.isArray(debriefJson.scores)) {
        throw new Error('Invalid debrief JSON: missing scores array')
      }
    } catch (parseError) {
      console.error('Failed to parse debrief JSON:', parseError instanceof Error ? parseError.message : String(parseError))
      console.error('Response length:', debriefResponse.length)
      console.error('Response preview (first 1000 chars):', debriefResponse.substring(0, 1000))
      console.error('Response preview (last 500 chars):', debriefResponse.substring(Math.max(0, debriefResponse.length - 500)))
      
      // Try to fix common JSON issues (truncated responses, missing closing braces)
      let fixedJson = debriefResponse.trim()
      
      // If JSON appears truncated, try to complete it
      if (fixedJson.endsWith(',') || !fixedJson.endsWith('}')) {
        // Count open vs close braces to see if we need to close
        const openBraces = (fixedJson.match(/\{/g) || []).length
        const closeBraces = (fixedJson.match(/\}/g) || []).length
        const openBrackets = (fixedJson.match(/\[/g) || []).length
        const closeBrackets = (fixedJson.match(/\]/g) || []).length
        
        // Try to close incomplete structures
        if (openBrackets > closeBrackets) {
          fixedJson += ']'.repeat(openBrackets - closeBrackets)
        }
        if (openBraces > closeBraces) {
          fixedJson += '}'.repeat(openBraces - closeBraces)
        }
        
        // Try parsing again with fixed JSON
        try {
          debriefJson = JSON.parse(fixedJson)
          if (debriefJson.scores && Array.isArray(debriefJson.scores)) {
            console.log('Successfully parsed fixed JSON')
          } else {
            throw new Error('Fixed JSON still invalid')
          }
        } catch (fixError) {
          console.error('Failed to fix JSON, using fallback')
          // Fall through to fallback
        }
      }
      
      // Fallback: create a basic debrief structure
      if (!debriefJson) {
        debriefJson = {
          scores: competencyNames.map(name => ({
            competencyName: name,
            score: 3,
            justification: 'Analysis completed',
            strength: 'You completed the case study and provided analysis.',
            weakness: 'Consider deeper strategic thinking in future cases.',
            actionableAdvice: 'Review foundational lessons to strengthen your approach.',
          })),
          keyInsight: 'You demonstrated engagement with the case study material.',
          summaryText: 'You completed the case study and provided analysis across multiple decision points.',
        }
      }
    }

    // Build radar chart data from scores
    const radarChartData: DebriefResult['radarChartData'] = {
      financialAcumen: 0,
      strategicThinking: 0,
      marketAwareness: 0,
      riskManagement: 0,
      leadershipJudgment: 0,
    }

    debriefJson.scores.forEach((score: any) => {
      const radarKey = mapCompetencyToRadarKey(score.competencyName)
      if (radarKey) {
        radarChartData[radarKey] = Math.max(0, Math.min(5, score.score || 0))
      }
    })

    // Ensure at least one competency has a score (fallback)
    const hasAnyScore = Object.values(radarChartData).some(v => v > 0)
    if (!hasAnyScore && debriefJson.scores.length > 0) {
      const firstScore = debriefJson.scores[0]
      const radarKey = mapCompetencyToRadarKey(firstScore.competencyName) || 'strategicThinking'
      radarChartData[radarKey] = Math.max(0, Math.min(5, firstScore.score || 3))
    }

    // Generate gold standard exemplar (optional, transient)
    let goldStandardExemplar: string | undefined
    try {
      const exemplarPrompt = `Based on the case study "${simulation.case.title}" and the rubric criteria, generate a brief (2-3 paragraph) exemplar response that demonstrates excellence across all competencies. This should serve as a "gold standard" comparison.

Focus on:
- Clear strategic thinking
- Quantitative reasoning
- Risk awareness
- Stakeholder consideration
- Actionable recommendations

Write this as if it were a memo or executive summary from an expert consultant.`

      const exemplarGeminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: exemplarPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1000,
            }
          }),
        }
      )

      if (exemplarGeminiResponse.ok) {
        const exemplarData = await exemplarGeminiResponse.json()
        goldStandardExemplar = exemplarData.candidates?.[0]?.content?.parts?.[0]?.text
      }
    } catch (exemplarError) {
      console.warn('Failed to generate gold standard exemplar:', exemplarError)
      // Continue without exemplar
    }

    return {
      scores: debriefJson.scores || [],
      radarChartData,
      summaryText: debriefJson.summaryText || debriefJson.keyInsight || 'Analysis completed.',
      keyInsight: debriefJson.keyInsight || 'You completed the case study and demonstrated engagement with the material.',
      goldStandardExemplar,
    }
  } catch (error) {
    console.error('Error generating debrief:', error)
    throw new Error(`Failed to generate debrief: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

