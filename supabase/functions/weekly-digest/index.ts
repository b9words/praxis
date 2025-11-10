/**
 * Weekly Digest Email Scheduler
 * 
 * This edge function should be called by a cron job (Supabase Cron or external scheduler)
 * to send weekly summary emails to active users.
 * 
 * Schedule: Every Monday at 9:00 AM UTC
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Note: Edge functions can't import from lib directly
// The template function needs to be inlined or imported via URL
// For now, we'll inline a simplified version

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeeklyDigestData {
  userName: string
  lessonsCompleted: number
  simulationsCompleted: number
  timeSpent: number
  topCompetencies: Array<{ name: string; score: number }>
  recommendedContent: Array<{ title: string; type: 'lesson' | 'simulation'; url: string }>
}

// Inline email template generator (edge functions can't import lib files)
function generateDigestHTML(data: WeeklyDigestData): string {
  const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://execemy.com'
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Weekly Execemy Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Your Weekly Summary</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Keep up the momentum, ${data.userName}!</p>
  </div>
  <div style="background: #f9fafb; padding: 30px;">
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="margin-top: 0;">This Week's Achievements</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
        <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #667eea;">${data.lessonsCompleted}</div>
          <div style="color: #6b7280;">Lessons Completed</div>
        </div>
        <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #10b981;">${data.simulationsCompleted}</div>
          <div style="color: #6b7280;">Case Studies Completed</div>
        </div>
      </div>
      <div style="text-align: center; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6;">
        <div style="font-size: 24px; color: #3b82f6; font-weight: bold;">${data.timeSpent} minutes</div>
      </div>
    </div>
    ${data.topCompetencies.length > 0 ? `<div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;"><h2>Top Competencies</h2>${data.topCompetencies.map(c => `<div style="margin: 10px 0;"><strong>${c.name}</strong>: ${c.score.toFixed(1)}/5</div>`).join('')}</div>` : ''}
    ${data.recommendedContent.length > 0 ? `<div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;"><h2>Recommended</h2>${data.recommendedContent.map(item => `<div style="margin: 12px 0;"><a href="${appUrl}${item.url}" style="color: #667eea;">${item.title}</a></div>`).join('')}</div>` : ''}
    <div style="text-align: center; margin-top: 30px;">
      <a href="${appUrl}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Dashboard</a>
    </div>
  </div>
</body>
</html>
  `.trim()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify this is called by a cron job (check for secret header)
    const cronSecret = req.headers.get('x-cron-secret')
    const expectedSecret = Deno.env.get('CRON_SECRET')
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get all active users (users who have been active in the last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: activeUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name, email')
      // Note: email_notifications_enabled column may not exist in all database instances
      // .eq('email_notifications_enabled', true) // Only send to users who opted in
      .not('email', 'is', null)

    if (usersError || !activeUsers) {
      console.error('Error fetching active users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    // Process each user
    for (const user of activeUsers) {
      try {
        // Get user's activity for the past week
        // Lessons completed
        const { data: lessonsProgress } = await supabaseAdmin
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', weekStart.toISOString())

        const lessonsCompleted = lessonsProgress?.length || 0

        // Simulations completed
        const { data: simulations } = await supabaseAdmin
          .from('simulations')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', weekStart.toISOString())

        const simulationsCompleted = simulations?.length || 0

        // Time spent (from lesson progress)
        const totalTimeSpent = lessonsProgress?.reduce((sum, lp) => sum + (lp.time_spent_seconds || 0), 0) || 0
        const timeSpentMinutes = Math.round(totalTimeSpent / 60)

        // Top competencies (from recent debriefs)
        const { data: debriefs } = await supabaseAdmin
          .from('debriefs')
          .select(`
            scores,
            simulation:simulations!inner(user_id)
          `)
          .eq('simulation.user_id', user.id)
          .gte('created_at', weekStart.toISOString())
          .limit(10)

        const competencyScores: Record<string, number[]> = {}
        
        debriefs?.forEach((debrief: any) => {
          const scores = debrief.scores || {}
          Object.entries(scores).forEach(([comp, score]) => {
            if (typeof score === 'number') {
              if (!competencyScores[comp]) competencyScores[comp] = []
              competencyScores[comp].push(score)
            }
          })
        })

        const topCompetencies = Object.entries(competencyScores)
          .map(([name, scores]) => ({
            name,
            score: scores.reduce((a, b) => a + b, 0) / scores.length,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        // Skip if user has no activity
        if (lessonsCompleted === 0 && simulationsCompleted === 0) {
          continue
        }

        // Get recommended content (simplified - just get some lessons/cases)
        const { data: recommendedLessons } = await supabaseAdmin
          .from('articles')
          .select('id, title')
          .eq('published', true)
          .limit(2)

        const recommendedContent = (recommendedLessons || []).map((lesson: any) => ({
          title: lesson.title,
          type: 'lesson' as const,
          url: `/library/article/${lesson.id}`,
        }))

        // Generate email
        const digestData: WeeklyDigestData = {
          userName: user.full_name || user.username || 'there',
          lessonsCompleted,
          simulationsCompleted,
          timeSpent: timeSpentMinutes,
          topCompetencies,
          recommendedContent,
        }

        // Inline email template (edge functions can't import lib files)
        const htmlContent = generateDigestHTML(digestData)

        // Send email via Resend API
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
        if (!RESEND_API_KEY) {
          console.error('RESEND_API_KEY not configured')
          continue
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@execemy.com',
            to: user.email,
            subject: `Your Weekly Execemy Summary - ${lessonsCompleted} lessons, ${simulationsCompleted} case studies`,
            html: htmlContent,
          }),
        })

        if (emailResponse.ok) {
          results.push({ userId: user.id, status: 'sent' })
        } else {
          results.push({ userId: user.id, status: 'failed', error: await emailResponse.text() })
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({ userId: user.id, status: 'error', error: String(error) })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in weekly-digest function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

