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
    const systemPrompt = `You are the Praxis Study Assistant, an expert educator helping students understand business concepts. Your role is to answer questions about the article content provided to you.

CRITICAL CONSTRAINTS:
- You MUST ONLY use information from the article provided below. Do not introduce outside information.
- If the question cannot be answered using the article content, say so explicitly.
- Keep your answers concise (2-4 sentences) and directly relevant to the question.
- Use the Socratic method when appropriate—help the student think through the concept rather than just giving them the answer.

ARTICLE CONTENT:
${articleContent}

Now answer the student's question using ONLY the information from the article above.`

    // Call Gemini API
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
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API request failed: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate response'

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



