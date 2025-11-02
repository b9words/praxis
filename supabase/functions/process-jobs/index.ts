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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get pending jobs
    const { data: jobs, error: fetchError } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5)

    if (fetchError) {
      throw new Error(`Failed to fetch jobs: ${fetchError.message}`)
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending jobs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0

    for (const job of jobs) {
      try {
        // Mark job as processing
        await supabaseClient
          .from('jobs')
          .update({ status: 'processing' })
          .eq('id', job.id)

        if (job.type === 'debrief_generation') {
          const payload = job.payload as any
          const simulationId = payload.simulationId

          if (!simulationId) {
            throw new Error('Missing simulationId in job payload')
          }

          // Call the generate-debrief edge function
          const debriefUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-debrief`
          const debriefResponse = await fetch(debriefUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              simulationId,
              isBackgroundJob: true,
            }),
          })

          if (!debriefResponse.ok) {
            const errorText = await debriefResponse.text()
            throw new Error(`Debrief generation failed: ${errorText}`)
          }

          const debriefData = await debriefResponse.json()

          // Update job with result
          await supabaseClient
            .from('jobs')
            .update({
              status: 'completed',
              result: debriefData,
              processed_at: new Date().toISOString(),
            })
            .eq('id', job.id)

          // Send simulation complete email
          try {
            // Fetch simulation and user data for email
            const { data: simulation } = await supabaseClient
              .from('simulations')
              .select('id, case:cases(title), user_id')
              .eq('id', simulationId)
              .single()

            if (simulation && simulation.user_id) {
              // Get user email from auth.users using admin API
              const { data: authUser } = await supabaseClient.auth.admin.getUserById(simulation.user_id)
              const userEmail = authUser?.user?.email

              if (userEmail) {
                const caseTitle = (simulation.case as any)?.title || 'Simulation'
                const baseUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://execemy.com'
                const debriefUrl = `${baseUrl}/debrief/${simulationId}`

                // Get user name from profile
                const { data: profile } = await supabaseClient
                  .from('profiles')
                  .select('full_name, username')
                  .eq('id', simulation.user_id)
                  .single()

                const userName = profile?.full_name || profile?.username || undefined

                // Call Next.js API route to send email
                // This route handles the email template rendering and sending
                const emailApiUrl = `${baseUrl}/api/internal/send-simulation-complete-email`
                const resendApiKey = Deno.env.get('RESEND_API_KEY')

                if (resendApiKey) {
                  // Send email directly using Resend API
                  const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${resendApiKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      from: 'Execemy Platform <noreply@execemy.com>',
                      to: userEmail,
                      subject: `Your ${caseTitle} Debrief is Ready`,
                      html: `
                        <!DOCTYPE html>
                        <html>
                          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                              ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi there,</p>'}
                              <p>Great work completing the "${caseTitle}" simulation! Your personalized performance debrief is now ready.</p>
                              <p style="margin: 30px 0;">
                                <a href="${debriefUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                  View Your Debrief
                                </a>
                              </p>
                              <p>Review your performance scores, receive personalized feedback, and discover recommended lessons to strengthen your skills.</p>
                              <p>Keep learning,<br>The Execemy Team</p>
                            </div>
                          </body>
                        </html>
                      `,
                    }),
                  })

                  if (!resendResponse.ok) {
                    console.error('Failed to send simulation complete email:', await resendResponse.text())
                  }
                } else {
                  console.warn('RESEND_API_KEY not configured, skipping email')
                }
              }
            }
          } catch (emailError) {
            // Don't fail the job if email sending fails
            console.error('Failed to send simulation complete email:', emailError)
          }

          processedCount++
        } else if (job.type === 'thumbnail_generation') {
          // Handle thumbnail generation
          const payload = job.payload as any
          const { contentId, contentType, title, domainName, competencyName } = payload

          if (!contentId || !contentType) {
            throw new Error('Missing contentId or contentType in job payload')
          }

          // Call the generate-thumbnail edge function
          const thumbnailUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-thumbnail`
          const thumbnailResponse = await fetch(thumbnailUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              contentId,
              contentType,
              title,
              domainName,
              competencyName,
            }),
          })

          if (!thumbnailResponse.ok) {
            const errorText = await thumbnailResponse.text()
            throw new Error(`Thumbnail generation failed: ${errorText}`)
          }

          const thumbnailData = await thumbnailResponse.json()

          // Update job with result
          await supabaseClient
            .from('jobs')
            .update({
              status: 'completed',
              result: thumbnailData,
              processed_at: new Date().toISOString(),
            })
            .eq('id', job.id)

          processedCount++
        } else {
          // Unknown job type - mark as failed
          await supabaseClient
            .from('jobs')
            .update({
              status: 'failed',
              error: `Unknown job type: ${job.type}`,
              processed_at: new Date().toISOString(),
            })
            .eq('id', job.id)
        }
      } catch (jobError) {
        // Mark job as failed
        await supabaseClient
          .from('jobs')
          .update({
            status: 'failed',
            error: jobError instanceof Error ? jobError.message : String(jobError),
            processed_at: new Date().toISOString(),
          })
          .eq('id', job.id)

        console.error(`Job ${job.id} failed:`, jobError)
      }
    }

    return new Response(
      JSON.stringify({ processed: processedCount, message: `Processed ${processedCount} job(s)` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in process-jobs:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

