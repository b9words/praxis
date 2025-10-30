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
    const { caseData, personaName, personaRole, chatHistory, userMessage } = await req.json()

    if (!caseData || !personaName || !personaRole || !userMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Construct the AI persona prompt
    const systemPrompt = `You are ${personaName}, ${personaRole}, in a business case simulation. Your role is to interact with the user as this character would.

CRITICAL CONSTRAINTS:
- Stay strictly in character as ${personaName}, ${personaRole}
- Base ALL your responses on the case information provided below
- Show the personality, motivations, and biases described for this character
- Do not break character or provide meta-commentary
- Keep responses conversational and realistic (2-4 sentences typically)
- Challenge the user's ideas if appropriate for your character
- Be helpful but maintain your character's perspective and constraints

CASE INFORMATION:
${JSON.stringify(caseData, null, 2)}

CHARACTER BACKGROUND:
Role: ${personaRole}
Name: ${personaName}

Based on the case information above, respond to the user's messages as this character would, maintaining their perspective, knowledge level, and motivations.`

    // Build conversation history for context
    const conversationHistory = chatHistory.map((msg: any) => ({
      parts: [{ text: msg.content }]
    }))

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
              parts: [{ text: systemPrompt }]
            },
            ...conversationHistory,
            {
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 300,
          }
        }),
      }

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Gemini API request failed: ${response.status} - ${errorText}`)
        ;(error as any).status = response.status
        throw error
      }

      return response
    })

    const geminiData = await geminiResponse.json()
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I need a moment to think about that.'

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

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ai-persona-chat:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


