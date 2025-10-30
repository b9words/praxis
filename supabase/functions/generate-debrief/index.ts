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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Construct the AI Coach prompt
    const systemPrompt = `You are an expert business school professor and executive coach named 'The Praxis Coach'. Your task is to analyze a user's performance in a business simulation and provide a structured, data-driven debrief.

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

    // Call Gemini API with JSON mode
    const geminiResponse = await fetch(
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

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API request failed: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const rawResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawResponse) {
      throw new Error('No response from Gemini API')
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

    // Insert debrief into database
    const { data: debrief, error: insertError } = await supabaseClient
      .from('debriefs')
      .insert({
        simulation_id: simulationId,
        scores: debriefData.scores,
        summary_text: debriefData.summaryText,
        radar_chart_data: debriefData.radarChartData,
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



