/**
 * Email service wrapper
 * Supports Resend by default, can be extended for other providers
 */

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

interface EmailService {
  sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }>
}

class ResendEmailService implements EmailService {
  private apiKey: string
  private fromEmail: string

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || ''
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@execemy.com'
  }

  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: params.from || this.fromEmail,
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          html: params.html,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Resend API error:', error)
        
        // Capture email send failures in Sentry for monitoring
        if (typeof window === 'undefined') {
          // Server-side: import and capture
          import('@/lib/monitoring').then(({ captureMessage }) => {
            captureMessage('Email send failed via Resend', 'error', {
              status: response.status,
              recipient: Array.isArray(params.to) ? params.to[0] : params.to,
              error: error.substring(0, 200), // Limit error length
            })
          }).catch(() => {
            // Monitoring not available
          })
        }
        
        return { success: false, error: `Failed to send email: ${response.status}` }
      }

      const data = await response.json()
      return { success: true, messageId: data.id }
    } catch (error) {
      console.error('Error sending email:', error)
      
      // Capture email send exceptions in Sentry
      if (typeof window === 'undefined') {
        import('@/lib/monitoring').then(({ captureException }) => {
          if (error instanceof Error) {
            captureException(error, {
              service: 'resend',
              recipient: Array.isArray(params.to) ? params.to[0] : params.to,
            })
          }
        }).catch(() => {
          // Monitoring not available
        })
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

// Export singleton instance
const emailService: EmailService = new ResendEmailService()

/**
 * Send an email
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return emailService.sendEmail(params)
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userEmail: string, userName?: string) {
  const { renderEmailTemplate, getEmailSubject } = await import('./email-templates')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'
  const html = await renderEmailTemplate('welcome', {
    welcome: {
      userName,
      loginUrl: `${baseUrl}/dashboard`,
    },
  })

  return sendEmail({
    to: userEmail,
    subject: getEmailSubject('welcome', { welcome: { userName } }),
    html,
  })
}


/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  userEmail: string,
  planName: string,
  userName?: string
) {
  const { renderEmailTemplate, getEmailSubject } = await import('./email-templates')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'
  const html = await renderEmailTemplate('subscription_confirmation', {
    subscription_confirmation: {
      planName,
      userName,
      dashboardUrl: `${baseUrl}/dashboard`,
    },
  })

  return sendEmail({
    to: userEmail,
    subject: getEmailSubject('subscription_confirmation', { subscription_confirmation: { planName } }),
    html,
  })
}

/**
 * Send simulation complete email
 */
export async function sendSimulationCompleteEmail(
  userEmail: string,
  caseTitle: string,
  debriefUrl?: string,
  userName?: string
) {
  const { renderEmailTemplate, getEmailSubject } = await import('./email-templates')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'
  const html = await renderEmailTemplate('simulation_complete', {
    simulation_complete: {
      caseTitle,
      debriefUrl: debriefUrl || `${baseUrl}/dashboard`,
      userName,
    },
  })

  return sendEmail({
    to: userEmail,
    subject: getEmailSubject('simulation_complete', { simulation_complete: { caseTitle } }),
    html,
  })
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummaryEmail(
  userEmail: string,
  options: {
    userName?: string
    articlesCompleted?: number
    simulationsCompleted?: number
    lessonsCompleted?: number
    strongestCompetency?: string
    simulatorTimeMinutes?: number
    simulatorTimeChangePct?: number
    recommendedContent?: Array<{ title: string; type: 'lesson' | 'case'; url: string; reason?: string }>
  }
) {
  const { renderEmailTemplate, getEmailSubject } = await import('./email-templates')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'
  const html = await renderEmailTemplate('weekly_summary', {
    weekly_summary: {
      ...options,
      dashboardUrl: `${baseUrl}/dashboard`,
    },
  })

  return sendEmail({
    to: userEmail,
    subject: getEmailSubject('weekly_summary', { weekly_summary: options }),
    html,
  })
}

/**
 * Send general notification email
 */
export async function sendGeneralNotificationEmail(
  userEmail: string,
  options: {
    title: string
    message: string
    actionUrl?: string
    actionText?: string
    userName?: string
  }
) {
  const { renderEmailTemplate, getEmailSubject } = await import('./email-templates')
  
  const html = await renderEmailTemplate('general', {
    general: options,
  })

  return sendEmail({
    to: userEmail,
    subject: getEmailSubject('general', { general: options }),
    html,
  })
}

/**
 * Send application status email
 */
export async function sendApplicationStatusEmail(
  userEmail: string,
  status: 'approved' | 'rejected',
  userName?: string
) {
  const { renderEmailTemplate, getEmailSubject } = await import('./email-templates')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'
  const html = await renderEmailTemplate('general', {
    general: {
      title: status === 'approved' ? 'Application Approved' : 'Application Update',
      message: status === 'approved' 
        ? `Congratulations! Your application has been approved. You can now access the full platform.`
        : `We regret to inform you that your application was not approved at this time.`,
      actionUrl: status === 'approved' ? `${baseUrl}/dashboard` : `${baseUrl}/dashboard`,
      actionText: status === 'approved' ? 'Go to Dashboard' : 'Learn More',
      userName,
    },
  })

  return sendEmail({
    to: userEmail,
    subject: getEmailSubject('general', { 
      general: {
        title: status === 'approved' ? 'Application Approved' : 'Application Update',
        message: status === 'approved' ? 'Your application has been approved.' : 'Your application status has been updated.',
      }
    }),
    html,
  })
}

