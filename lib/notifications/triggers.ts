import { prisma } from '@/lib/prisma/server'

export type NotificationType = 
  | 'application_approved'
  | 'application_rejected'
  | 'forum_reply'
  | 'simulation_complete'
  | 'weekly_summary'
  | 'general'

/**
 * Create a notification for a user
 */
export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || {},
        read: false,
      },
    })
    return notification
  } catch (error: any) {
    // Handle Prisma errors gracefully - don't throw to prevent cascading failures
    const { getPrismaErrorInfo } = await import('@/lib/prisma-error-handler')
    const errorInfo = getPrismaErrorInfo(error)
    
    if (errorInfo) {
      // Log but don't throw - notification creation failures shouldn't break the app
      console.error(`Failed to create notification (${errorInfo.code}):`, errorInfo.message)
    } else {
      console.error('Failed to create notification:', error)
    }
    
    // Return null instead of throwing - allows calling code to handle gracefully
    return null
  }
}

/**
 * Create notification when simulation is completed
 */
export async function notifySimulationComplete(userId: string, simulationId: string, caseTitle: string) {
  return createNotification({
    userId,
    type: 'simulation_complete',
    title: 'Simulation Complete',
    message: `You have completed the "${caseTitle}" simulation. View your after-action report to see your results and feedback.`,
    link: `/debrief/${simulationId}`,
    metadata: {
      simulationId,
      caseTitle,
    },
  })
}

/**
 * Create notification when debrief generation fails repeatedly (3+ times)
 */
export async function notifyDebriefGenerationFailure(userId: string, simulationId: string, failureCount: number) {
  if (failureCount >= 3) {
    return createNotification({
      userId,
      type: 'general',
      title: 'Debrief Generation Issue',
      message: `We encountered an issue generating your debrief. Our team has been notified and will investigate. Please try again later or contact support if the problem persists.`,
      link: `/simulations`,
      metadata: {
        simulationId,
        failureCount,
      },
    })
  }
  return null
}

/**
 * Create notification when forum reply is received
 */
export async function notifyForumReply(
  userId: string,
  threadTitle: string,
  threadId: string,
  authorName: string
) {
  return createNotification({
    userId,
    type: 'forum_reply',
    title: 'New Reply',
    message: `${authorName} replied to "${threadTitle}"`,
    link: `/community/thread/${threadId}`,
    metadata: {
      threadId,
      threadTitle,
      authorName,
    },
  })
}

/**
 * Create notification when application is approved/rejected
 */
export async function notifyApplicationStatus(
  userId: string | null,
  email: string,
  status: 'approved' | 'rejected',
  applicationId: string
) {
  if (!userId) {
    // If no user ID, we can't create in-app notification
    // Email will be sent via email service
    return null
  }

  return createNotification({
    userId,
    type: status === 'approved' ? 'application_approved' : 'application_rejected',
    title: status === 'approved' 
      ? 'Application Approved!' 
      : 'Application Update',
    message: status === 'approved'
      ? 'Your application to Praxis Platform has been approved. Welcome!'
      : 'Your application to Praxis Platform has been reviewed. Check your email for details.',
    link: status === 'approved' ? '/dashboard' : undefined,
    metadata: {
      applicationId,
      status,
    },
  })
}

/**
 * Batch create notifications for weekly summary
 */
export async function createWeeklySummaryNotifications(userIds: string[]) {
  const notifications = await Promise.all(
    userIds.map((userId) =>
      createNotification({
        userId,
        type: 'weekly_summary',
        title: 'Your Weekly Summary',
        message: 'Check out your progress this week and see what\'s next in your learning journey.',
        link: '/dashboard',
        metadata: {
          week: new Date().toISOString(),
        },
      })
    )
  )
  return notifications
}

