/**
 * Email template renderer using React Email
 * Converts React Email components to HTML strings for Resend
 */

import { GeneralNotificationEmail } from '@/components/emails/GeneralNotificationEmail'
import { CaseStudyCompleteEmail } from '@/components/emails/CaseStudyCompleteEmail'
import { SubscriptionConfirmationEmail } from '@/components/emails/SubscriptionConfirmationEmail'
import { WeeklySummaryEmail } from '@/components/emails/WeeklySummaryEmail'
import { WelcomeEmail } from '@/components/emails/WelcomeEmail'
import { render } from '@react-email/render'

export type EmailTemplateType = 
  | 'welcome'
  | 'simulation_complete'
  | 'weekly_summary'
  | 'general'
  | 'subscription_confirmation'

interface EmailTemplateProps {
  welcome?: {
    userName?: string
    loginUrl?: string
  }
  simulation_complete?: {
    caseTitle: string
    debriefUrl?: string
    userName?: string
  }
  weekly_summary?: {
    userName?: string
    articlesCompleted?: number
    simulationsCompleted?: number
    lessonsCompleted?: number
    dashboardUrl?: string
    strongestCompetency?: string
    simulatorTimeMinutes?: number
    simulatorTimeChangePct?: number
    recommendedContent?: Array<{ title: string; type: 'lesson' | 'case'; url: string; reason?: string }>
  }
  general?: {
    title: string
    message: string
    actionUrl?: string
    actionText?: string
    userName?: string
  }
  subscription_confirmation?: {
    planName: string
    userName?: string
    dashboardUrl?: string
  }
}

/**
 * Render email template to HTML string
 */
export async function renderEmailTemplate(
  templateType: EmailTemplateType,
  props: EmailTemplateProps
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'

  switch (templateType) {
    case 'welcome':
      return await render(
        WelcomeEmail({
          userName: props.welcome?.userName,
          loginUrl: props.welcome?.loginUrl || `${baseUrl}/dashboard`,
        })
      )

    case 'simulation_complete':
      if (!props.simulation_complete?.caseTitle) {
        throw new Error('caseTitle is required for simulation_complete template')
      }
      return await render(
        CaseStudyCompleteEmail({
          caseTitle: props.simulation_complete.caseTitle,
          debriefUrl: props.simulation_complete.debriefUrl || `${baseUrl}/dashboard`,
          userName: props.simulation_complete.userName,
        })
      )

    case 'weekly_summary':
      return await render(
        WeeklySummaryEmail({
          userName: props.weekly_summary?.userName,
          articlesCompleted: props.weekly_summary?.articlesCompleted,
          simulationsCompleted: props.weekly_summary?.simulationsCompleted,
          lessonsCompleted: props.weekly_summary?.lessonsCompleted,
          dashboardUrl: props.weekly_summary?.dashboardUrl || `${baseUrl}/dashboard`,
          strongestCompetency: props.weekly_summary?.strongestCompetency,
          simulatorTimeMinutes: props.weekly_summary?.simulatorTimeMinutes,
          simulatorTimeChangePct: props.weekly_summary?.simulatorTimeChangePct,
          recommendedContent: props.weekly_summary?.recommendedContent,
        })
      )

    case 'general':
      if (!props.general?.title || !props.general?.message) {
        throw new Error('title and message are required for general template')
      }
      return await render(
        GeneralNotificationEmail({
          title: props.general.title,
          message: props.general.message,
          actionUrl: props.general.actionUrl,
          actionText: props.general.actionText,
          userName: props.general.userName,
        })
      )

    case 'subscription_confirmation':
      if (!props.subscription_confirmation?.planName) {
        throw new Error('planName is required for subscription_confirmation template')
      }
      return await render(
        SubscriptionConfirmationEmail({
          planName: props.subscription_confirmation.planName,
          userName: props.subscription_confirmation.userName,
          dashboardUrl: props.subscription_confirmation.dashboardUrl || `${baseUrl}/dashboard`,
        })
      )

    default:
      throw new Error(`Unknown template type: ${templateType}`)
  }
}

/**
 * Get email subject for template type
 */
export function getEmailSubject(templateType: EmailTemplateType, props: EmailTemplateProps): string {
  switch (templateType) {
    case 'welcome':
      return 'Access Granted — Welcome to Execemy'
    
    case 'simulation_complete':
      return `Debrief Ready: ${props.simulation_complete?.caseTitle || 'Your Simulation'}`
    
    case 'weekly_summary':
      return 'Your Weekly Briefing'
    
    case 'general':
      return props.general?.title || 'Notification from Execemy Platform'
    
    case 'subscription_confirmation':
      return 'Subscription Confirmed - Execemy Platform'
    
    default:
      return 'Notification from Execemy Platform'
  }
}

