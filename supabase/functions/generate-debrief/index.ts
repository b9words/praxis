import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth header
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { simulationId } = await req.json()

    if (!simulationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: simulationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch simulation data
    const { data: simulation, error: simError } = await supabaseClient
      .from('simulations')
      .select('*, case:cases(*)')
      .eq('id', simulationId)
      .eq('user_id', user.id)
      .single()

    if (simError || !simulation) {
      return new Response(
        JSON.stringify({ error: 'Simulation not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (simulation.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Simulation must be completed before generating debrief' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that case data exists
    if (!simulation.case) {
      return new Response(
        JSON.stringify({ error: 'Case data not found for simulation' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that rubric exists
    if (!simulation.case.rubric) {
      return new Response(
        JSON.stringify({ error: 'Rubric not found for case' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract rubric version if present
    const rubricVersion = (simulation.case.rubric as any)?.version || null

    // Check if debrief already exists (idempotency)
    const { data: existingDebrief } = await supabaseClient
      .from('debriefs')
      .select('*')
      .eq('simulation_id', simulationId)
      .single()

    if (existingDebrief) {
      return new Response(
        JSON.stringify({ 
          debriefId: existingDebrief.id, 
          debrief: existingDebrief,
          fromCache: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that user inputs exist
    if (!simulation.user_inputs || typeof simulation.user_inputs !== 'object') {
      return new Response(
        JSON.stringify({ error: 'User inputs not found or invalid for simulation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Construct the AI Coach prompt
    const systemPrompt = `You are an expert business school professor and executive coach named 'The Execemy Coach'. Your task is to analyze a user's performance in a business simulation and provide a structured, data-driven debrief.

You will be given a rubric and the user's submitted decisions. You MUST evaluate the user's inputs STRICTLY against the provided rubric. Do not introduce outside information or subjective opinions.

Your response MUST be a single, valid JSON object. Do not include any text or markdown before or after the JSON object.

The JSON object must conform to the following schema:
{
  "scores": [
    {
      "competencyName": string (one of the competencies from the rubric),
      "score": number (1 to 5),
      "justification": string (1-2 sentences explaining the score, directly referencing the user's inputs and rubric criteria)
    }
  ],
  "summaryText": string (3-4 sentences overall summary, highlighting one key strength and one area for improvement),
  "radarChartData": {
    "financialAcumen": number (0-5),
    "strategicThinking": number (0-5),
    "marketAwareness": number (0-5),
    "riskManagement": number (0-5),
    "leadershipJudgment": number (0-5)
  }
}

IMPORTANT: The radarChartData should include ALL five core competencies, even if this specific case only tested some of them. For untested competencies, use 0.`

    const userPrompt = `**Rubric:**
${JSON.stringify(simulation.case.rubric, null, 2)}

**User Inputs:**
${JSON.stringify(simulation.user_inputs, null, 2)}`

    // Retry helper for Deno with exponential backoff
    async function retryWithBackoff<T>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
      initialDelay: number = 1000
    ): Promise<T> {
      let lastError: Error | null = null
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn()
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          if (attempt === maxRetries) throw lastError
          
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(initialDelay * Math.pow(2, attempt), 8000)
          await new Promise(resolve => setTimeout(resolve, delay))
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
        }
      }
      throw lastError || new Error('Retry exhausted')
    }

    // Call Gemini API with retry logic
    const geminiResponse = await retryWithBackoff(async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2000,
              responseMimeType: 'application/json',
            }
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Gemini API request failed: ${response.status} - ${errorText}`)
        ;(error as any).status = response.status
        throw error
      }

      return response
    })

    const geminiData = await geminiResponse.json()
    const rawResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawResponse) {
      throw new Error('No response from Gemini API')
    }

    // Track token usage
    const usageMetadata = geminiData.usageMetadata
    if (usageMetadata) {
      try {
        const supabaseServiceClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        const today = new Date().toISOString().split('T')[0]
        
        await supabaseServiceClient
          .from('token_usage')
          .insert({
            date: today,
            model: 'gemini-1.5-flash',
            prompt_tokens: usageMetadata.promptTokenCount || 0,
            completion_tokens: usageMetadata.candidatesTokenCount || 0,
            total_tokens: usageMetadata.totalTokenCount || 0,
          })
      } catch (tokenError) {
        // Log but don't fail the request if token tracking fails
        console.error('Failed to track token usage:', tokenError)
      }
    }

    // Parse the JSON response
    let debriefData
    try {
      debriefData = JSON.parse(rawResponse)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', rawResponse)
      throw new Error('Failed to parse AI response as JSON')
    }

    // Validate the response structure
    if (!debriefData.scores || !debriefData.summaryText || !debriefData.radarChartData) {
      throw new Error('Invalid response structure from AI')
    }

    // Comprehensive validation function
    function validateAndNormalizeDebrief(data: any, rubric: any): any {
      const errors: string[] = []
      const normalized: any = {
        scores: [],
        summaryText: '',
        radarChartData: {},
      }

      // Validate scores array
      if (!Array.isArray(data.scores)) {
        errors.push('Scores must be an array')
      } else {
        // Get expected competency names from rubric
        const rubricCompetencies = rubric?.criteria ? Object.keys(rubric.criteria) : []
        
        // Validate each score
        const processedCompetencies = new Set<string>()
        for (const scoreItem of data.scores) {
          if (!scoreItem || typeof scoreItem !== 'object') {
            errors.push('Score item must be an object')
            continue
          }

          const competencyName = scoreItem.competencyName || scoreItem.competency
          if (!competencyName || typeof competencyName !== 'string') {
            errors.push('Score item missing competencyName')
            continue
          }

          // Normalize competency name to match rubric keys
          const normalizedName = competencyName.toLowerCase().replace(/\s+/g, '-')
          
          // Validate score is a number between 1 and 5
          let score = scoreItem.score
          if (typeof score === 'string') {
            score = parseFloat(score)
          }
          if (typeof score !== 'number' || isNaN(score)) {
            errors.push(`Invalid score for ${competencyName}: must be a number`)
            score = 3 // Default to middle score
          } else {
            // Clamp score to valid range [1, 5]
            score = Math.max(1, Math.min(5, Math.round(score * 10) / 10)) // Round to 1 decimal
          }

          // Validate justification
          const justification = scoreItem.justification || scoreItem.feedback || ''
          if (typeof justification !== 'string' || justification.trim().length === 0) {
            errors.push(`Missing justification for ${competencyName}`)
          }

          normalized.scores.push({
            competencyName,
            score,
            justification: justification.trim(),
          })
          
          processedCompetencies.add(normalizedName)
        }

        // Check that all rubric competencies are present (warn, don't fail)
        if (rubricCompetencies.length > 0) {
          for (const rubricComp of rubricCompetencies) {
            const normalized = rubricComp.toLowerCase().replace(/\s+/g, '-')
            if (!processedCompetencies.has(normalized) && !processedCompetencies.has(rubricComp.toLowerCase())) {
              console.warn(`Rubric competency "${rubricComp}" not found in scores, adding with default score 0`)
              normalized.scores.push({
                competencyName: rubricComp,
                score: 0,
                justification: 'This competency was not assessed in this simulation.',
              })
            }
          }
        }
      }

      // Validate summaryText
      if (typeof data.summaryText !== 'string' || data.summaryText.trim().length === 0) {
        errors.push('Summary text is required and must be a non-empty string')
        normalized.summaryText = 'Performance analysis completed.'
      } else {
        normalized.summaryText = data.summaryText.trim()
      }

      // Validate and normalize radarChartData
      const requiredCompetencies = [
        'financialAcumen',
        'strategicThinking',
        'marketAwareness',
        'riskManagement',
        'leadershipJudgment',
      ]

      if (!data.radarChartData || typeof data.radarChartData !== 'object') {
        errors.push('RadarChartData must be an object')
        // Initialize with zeros
        normalized.radarChartData = {}
        for (const comp of requiredCompetencies) {
          normalized.radarChartData[comp] = 0
        }
      } else {
        // Ensure all 5 core competencies are present with valid values
        for (const comp of requiredCompetencies) {
          let value = data.radarChartData[comp]
          if (typeof value === 'string') {
            value = parseFloat(value)
          }
          if (typeof value !== 'number' || isNaN(value)) {
            // Try to find score from scores array
            const scoreItem = normalized.scores.find((s: any) => {
              const name = (s.competencyName || '').toLowerCase()
              return name.includes(comp.toLowerCase()) || comp.toLowerCase().includes(name)
            })
            value = scoreItem ? scoreItem.score : 0
          }
          // Clamp to [0, 5] range
          normalized.radarChartData[comp] = Math.max(0, Math.min(5, Math.round(value * 10) / 10))
        }
      }

      // If there are critical errors, throw
      if (errors.length > 0) {
        console.error('Debrief validation errors:', errors)
        // Log but don't fail - use normalized data as fallback
        // This ensures the debrief can still be saved even with validation issues
      }

      return normalized
    }

    // Validate and normalize the debrief data
    const validatedDebrief = validateAndNormalizeDebrief(debriefData, simulation.case.rubric)

    // Insert debrief into database (upsert for idempotency)
    const { data: debrief, error: insertError } = await supabaseClient
      .from('debriefs')
      .upsert({
        simulation_id: simulationId,
        scores: validatedDebrief.scores,
        summary_text: validatedDebrief.summaryText,
        radar_chart_data: validatedDebrief.radarChartData,
        rubric_version: rubricVersion,
      }, {
        onConflict: 'simulation_id',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert debrief:', insertError)
      throw new Error('Failed to save debrief to database')
    }

    return new Response(
      JSON.stringify({ debriefId: debrief.id, debrief }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-debrief:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})



