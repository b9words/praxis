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

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

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

        // Only send email if user had activity
        if (lessonsCompleted > 0 || simulationsCompleted > 0 || articlesCompleted > 0) {
          const userName = user.fullName || user.username || undefined
          
          const result = await sendWeeklySummaryEmail(user.email, {
            userName,
            lessonsCompleted,
            simulationsCompleted,
            articlesCompleted,
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

