import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma/server'
import { getActiveAutomatedEmailsForEvent } from '@/lib/db/automatedEmails'
import {
  sendWelcomeEmail,
  sendGeneralNotificationEmail,
  sendWeeklySummaryEmail,
} from '@/lib/email'

export const runtime = 'nodejs'

/**
 * GET /api/cron/process-emails
 * Process delayed emails and inactivity checks
 * 
 * This route should be called daily by a cron job service
 * (e.g., Vercel Cron Jobs or Supabase Scheduled Functions)
 */
export async function GET(request: NextRequest) {
  try {
    // Security check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const results = {
      dripCampaigns: { processed: 0, sent: 0, failed: 0 },
      inactivity: { processed: 0, sent: 0, failed: 0 },
    }

    // --- 1. Process Drip Campaigns (delayed emails) ---
    const signupEmails = await getActiveAutomatedEmailsForEvent('user_signed_up')
    const delayedEmails = signupEmails.filter((email) => email.delayDays > 0)

    for (const emailConfig of delayedEmails) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - emailConfig.delayDays)
      targetDate.setHours(0, 0, 0, 0) // Start of target day

      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1) // Start of next day

      // Paginate through all users to find those who signed up on the target date
      const perPage = 1000
      let page = 1
      let hasMore = true

      while (hasMore) {
        const { data: authUsersPage, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        })

        if (listUsersError) {
          console.error(`Error fetching users page ${page} from Supabase:`, listUsersError)
          break
        }

        if (!authUsersPage || authUsersPage.users.length === 0) {
          hasMore = false
          break
        }

        // Filter users who signed up on the target date
        const targetUsers = authUsersPage.users.filter((user) => {
          const createdAt = user.created_at ? new Date(user.created_at) : null
          if (!createdAt) return false
          return createdAt >= targetDate && createdAt < nextDay
        })

        results.dripCampaigns.processed += targetUsers.length

        for (const authUser of targetUsers) {
          if (!authUser.email) {
            results.dripCampaigns.failed++
            continue
          }

          try {
            // Get user profile for name and notification preferences
            let profile: { id: string; username: string; fullName: string | null; emailNotificationsEnabled?: boolean } | null = null
            try {
              profile = await prisma.profile.findUnique({
                where: { id: authUser.id },
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  emailNotificationsEnabled: true,
                },
              })
            } catch (error: any) {
              // If column doesn't exist, try without it
              const { isColumnNotFoundError } = await import('@/lib/db/utils')
              if (isColumnNotFoundError(error)) {
                profile = await prisma.profile.findUnique({
                  where: { id: authUser.id },
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                  },
                })
              } else {
                throw error
              }
            }

            // Skip if notifications disabled (only if column exists and is false)
            if (profile && 'emailNotificationsEnabled' in profile && !profile.emailNotificationsEnabled) {
              continue
            }

            const userEmail = authUser.email
            const userName = profile?.fullName || profile?.username || authUser.user_metadata?.full_name || authUser.user_metadata?.username || undefined

            // Send email based on template
            let sendResult

            switch (emailConfig.template) {
              case 'welcome':
                sendResult = await sendWelcomeEmail(userEmail, userName)
                break

              case 'general':
                sendResult = await sendGeneralNotificationEmail(userEmail, {
                  title: emailConfig.subject,
                  message: emailConfig.subject, // Use subject as message for general template
                  userName,
                })
                break

              case 'weekly_summary':
                sendResult = await sendWeeklySummaryEmail(userEmail, {
                  userName,
                })
                break

              default:
                console.warn(`Unsupported template for drip campaign: ${emailConfig.template}`)
                results.dripCampaigns.failed++
                continue
            }

            if (sendResult.success) {
              results.dripCampaigns.sent++
              console.log(`Drip email sent to ${userEmail} (${emailConfig.delayDays} days after signup)`)
            } else {
              results.dripCampaigns.failed++
              console.error(`Failed to send drip email to ${userEmail}:`, sendResult.error)
            }
          } catch (error) {
            results.dripCampaigns.failed++
            console.error(`Error processing drip email for user ${authUser.id}:`, error)
          }
        }

        // Check if there are more pages
        if (authUsersPage.users.length < perPage) {
          hasMore = false
        } else {
          page++
        }
      }
    }

    // --- 2. Process Inactivity Emails ---
    const inactivityEmails = await getActiveAutomatedEmailsForEvent('user_inactive')

    if (inactivityEmails.length > 0) {
      // Get the first active inactivity email config
      const inactivityConfig = inactivityEmails[0]

      // Find users who haven't logged in for 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Exclude accounts less than 7 days old (they haven't had a chance to be inactive)
      const accountAgeThreshold = new Date()
      accountAgeThreshold.setDate(accountAgeThreshold.getDate() - 7)

      // Paginate through all users to find inactive ones
      const perPage = 1000
      let page = 1
      let hasMore = true

      while (hasMore) {
        const { data: authUsersPage, error: authError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        })

        if (authError || !authUsersPage) {
          console.error(`Error fetching users page ${page} from Supabase:`, authError)
          break
        }

        if (authUsersPage.users.length === 0) {
          hasMore = false
          break
        }

        // Filter users who haven't signed in for 7+ days and are at least 7 days old
        const inactiveUsers = authUsersPage.users.filter((user) => {
          const createdAt = user.created_at ? new Date(user.created_at) : null
          const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null

          // Exclude accounts less than 7 days old
          if (!createdAt || createdAt > accountAgeThreshold) {
            return false
          }

          // Use last_sign_in_at if available, otherwise use created_at (for users who never logged in)
          const referenceDate = lastSignIn || createdAt

          if (!referenceDate) return false

          // Must be inactive for 7+ days
          return referenceDate < sevenDaysAgo
        })

        results.inactivity.processed += inactiveUsers.length

        for (const user of inactiveUsers) {
          if (!user.email) continue

          try {
            // Get user profile for name and notification preferences
            let profile: { id: string; username: string; fullName: string | null; emailNotificationsEnabled?: boolean } | null = null
            try {
              profile = await prisma.profile.findUnique({
                where: { id: user.id },
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  emailNotificationsEnabled: true,
                },
              })
            } catch (error: any) {
              // If column doesn't exist, try without it
              const { isColumnNotFoundError } = await import('@/lib/db/utils')
              if (isColumnNotFoundError(error)) {
                profile = await prisma.profile.findUnique({
                  where: { id: user.id },
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                  },
                })
              } else {
                throw error
              }
            }

            // Skip if notifications disabled (only if column exists and is false)
            if (profile && 'emailNotificationsEnabled' in profile && !profile.emailNotificationsEnabled) {
              continue
            }

            const userName = profile?.fullName || profile?.username || user.user_metadata?.full_name || user.user_metadata?.username || undefined

            // Send inactivity email
            const sendResult = await sendGeneralNotificationEmail(user.email, {
              title: inactivityConfig.subject,
              message: inactivityConfig.subject, // Use subject as message
              actionUrl: process.env.NEXT_PUBLIC_APP_URL
                ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
                : undefined,
              actionText: 'Return to Dashboard',
              userName,
            })

            if (sendResult.success) {
              results.inactivity.sent++
              console.log(`Inactivity email sent to ${user.email}`)
            } else {
              results.inactivity.failed++
              console.error(`Failed to send inactivity email to ${user.email}:`, sendResult.error)
            }
          } catch (error) {
            results.inactivity.failed++
            console.error(`Error processing inactivity email for user ${user.id}:`, error)
          }
        }

        // Check if there are more pages
        if (authUsersPage.users.length < perPage) {
          hasMore = false
        } else {
          page++
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in process-emails cron:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process emails',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

