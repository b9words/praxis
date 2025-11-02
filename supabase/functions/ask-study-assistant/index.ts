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
    const { articleId, userQuestion } = await req.json()

    if (!articleId || !userQuestion) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: articleId and userQuestion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Load article content from database
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: article, error: articleError } = await supabaseClient
      .from('articles')
      .select('content, storage_path')
      .eq('id', articleId)
      .single()

    if (articleError || !article) {
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Load full content from storage if available
    let articleContent = article.content || ''
    if (article.storage_path && !articleContent) {
      // Fetch from storage
      const { data: fileData, error: storageError } = await supabaseClient
        .storage
        .from('content')
        .download(article.storage_path)

      if (!storageError && fileData) {
        articleContent = await fileData.text()
      }
    }

    if (!articleContent) {
      return new Response(
        JSON.stringify({ error: 'Article content not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Construct the prompt for the Smart Study Assistant
    const systemPrompt = `You are the Execemy Study Assistant, an expert educator helping students understand business concepts. Your role is to answer questions about the article content provided to you.

CRITICAL CONSTRAINTS:
- You MUST ONLY use information from the article provided below. Do not introduce outside information.
- If the question cannot be answered using the article content, say so explicitly.
- Keep your answers concise (2-4 sentences) and directly relevant to the question.
- Use the Socratic method when appropriate—help the student think through the concept rather than just giving them the answer.

ARTICLE CONTENT:
${articleContent}

Now answer the student's question using ONLY the information from the article above.`

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
                { text: `\n\nSTUDENT QUESTION: ${userQuestion}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
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
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate response'

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
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in ask-study-assistant:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})



