import { prisma } from './prisma/server'
import { sendWeeklySummaryEmail } from './email'

export interface WeeklySummaryResult {
  success: boolean
  totalUsers: number
  emailsSent: number
  emailsFailed: number
  errors?: string[]
}

/**
 * Calculate and send weekly summary emails to users
 * Extracted from API route for reusability
 */
export async function sendWeeklySummaries(): Promise<WeeklySummaryResult> {
  const errors: string[] = []

  try {
    // Get all active users
    const users = await prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
      },
      // Only users who have opted in for emails (if you add this field)
      // where: { emailNotificationsEnabled: true }
    })

    const now = new Date()
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    // Competency key to display label mapping
    const competencyLabels: Record<string, string> = {
      financialAcumen: 'Financial Acumen',
      strategicThinking: 'Strategic Thinking',
      marketAwareness: 'Market Awareness',
      riskManagement: 'Risk Management',
      leadershipJudgment: 'Leadership Judgment',
    }

    let emailsSent = 0
    let emailsFailed = 0

    for (const user of users) {
      try {
        // Calculate progress for past week
        const [lessonsCompleted, simulationsCompleted, articlesCompleted] = await Promise.all([
          // Lessons completed in past week
          prisma.userLessonProgress.count({
            where: {
              userId: user.id,
              status: 'completed',
              completedAt: {
                gte: oneWeekAgo,
              },
            },
          }),
          // Simulations completed in past week
          prisma.simulation.count({
            where: {
              userId: user.id,
              status: 'completed',
              completedAt: {
                gte: oneWeekAgo,
              },
            },
          }),
          // Articles completed in past week
          prisma.userArticleProgress.count({
            where: {
              userId: user.id,
              status: 'completed',
              completedAt: {
                gte: oneWeekAgo,
              },
            },
          }),
        ])

        // Compute insights if there were simulations
        let strongestCompetency: string | undefined
        let simulatorTimeMinutes: number | undefined
        let simulatorTimeChangePct: number | undefined

        if (simulationsCompleted > 0) {
          // Get completed simulations with debriefs from this week
          const thisWeekSimulations = await prisma.simulation.findMany({
            where: {
              userId: user.id,
              status: 'completed',
              completedAt: {
                gte: oneWeekAgo,
              },
            },
            select: {
              startedAt: true,
              completedAt: true,
              debrief: {
                select: {
                  radarChartData: true,
                },
              },
            },
          })

          // Calculate simulator time for this week
          let totalMinutesThisWeek = 0
          for (const sim of thisWeekSimulations) {
            if (sim.completedAt && sim.startedAt) {
              const diffMs = sim.completedAt.getTime() - sim.startedAt.getTime()
              const minutes = Math.round(diffMs / (1000 * 60))
              totalMinutesThisWeek += minutes
            }
          }
          simulatorTimeMinutes = totalMinutesThisWeek > 0 ? totalMinutesThisWeek : undefined

          // Calculate simulator time for previous week
          const prevWeekSimulations = await prisma.simulation.findMany({
            where: {
              userId: user.id,
              status: 'completed',
              completedAt: {
                gte: twoWeeksAgo,
                lt: oneWeekAgo,
              },
            },
            select: {
              startedAt: true,
              completedAt: true,
            },
          })

          let totalMinutesPrevWeek = 0
          for (const sim of prevWeekSimulations) {
            if (sim.completedAt && sim.startedAt) {
              const diffMs = sim.completedAt.getTime() - sim.startedAt.getTime()
              const minutes = Math.round(diffMs / (1000 * 60))
              totalMinutesPrevWeek += minutes
            }
          }

          // Calculate percent change
          if (totalMinutesPrevWeek > 0 && simulatorTimeMinutes !== undefined) {
            simulatorTimeChangePct = Math.round(((simulatorTimeMinutes - totalMinutesPrevWeek) / totalMinutesPrevWeek) * 100)
          } else if (simulatorTimeMinutes !== undefined && simulatorTimeMinutes > 0 && totalMinutesPrevWeek === 0) {
            // If previous week had no time but this week does, show +100%
            simulatorTimeChangePct = 100
          }

          // Find strongest competency from debriefs
          const debriefs = thisWeekSimulations
            .map(sim => sim.debrief?.radarChartData)
            .filter((data): data is any => data !== null && typeof data === 'object')

          if (debriefs.length > 0) {
            // Average scores across all debriefs
            const averages: Record<string, number> = {}
            const counts: Record<string, number> = {}

            for (const debriefData of debriefs) {
              for (const key of Object.keys(competencyLabels)) {
                if (typeof debriefData[key] === 'number') {
                  averages[key] = (averages[key] || 0) + debriefData[key]
                  counts[key] = (counts[key] || 0) + 1
                }
              }
            }

            // Calculate averages
            for (const key of Object.keys(averages)) {
              if (counts[key] > 0) {
                averages[key] = averages[key] / counts[key]
              }
            }

            // Find the competency with the highest average
            let maxScore = -1
            let maxKey: string | undefined
            for (const [key, score] of Object.entries(averages)) {
              if (score > maxScore) {
                maxScore = score
                maxKey = key
              }
            }

            if (maxKey && competencyLabels[maxKey]) {
              strongestCompetency = competencyLabels[maxKey]
            }
          }
        }

        // Only send email if user had activity or insights
        if (lessonsCompleted > 0 || simulationsCompleted > 0 || articlesCompleted > 0 || strongestCompetency || simulatorTimeMinutes !== undefined) {
          const userName = user.fullName || user.username || undefined
          
          const result = await sendWeeklySummaryEmail(user.email, {
            userName,
            lessonsCompleted,
            simulationsCompleted,
            articlesCompleted,
            strongestCompetency,
            simulatorTimeMinutes,
            simulatorTimeChangePct,
          })

          if (result.success) {
            emailsSent++
          } else {
            emailsFailed++
            const errorMsg = `Failed to send weekly summary to ${user.email}: ${result.error || 'Unknown error'}`
            errors.push(errorMsg)
            console.error(errorMsg)
          }
        }
      } catch (error) {
        emailsFailed++
        const errorMsg = `Error processing weekly summary for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    return {
      success: true,
      totalUsers: users.length,
      emailsSent,
      emailsFailed,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    const errorMsg = `Error in weekly summary processing: ${error instanceof Error ? error.message : String(error)}`
    errors.push(errorMsg)
    console.error(errorMsg)
    
    return {
      success: false,
      totalUsers: 0,
      emailsSent: 0,
      emailsFailed: 0,
      errors,
    }
  }
}

