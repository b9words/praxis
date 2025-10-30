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
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@praxisplatform.com'
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
        return { success: false, error: `Failed to send email: ${response.status}` }
      }

      const data = await response.json()
      return { success: true, messageId: data.id }
    } catch (error) {
      console.error('Error sending email:', error)
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
  const subject = 'Welcome to Praxis Platform'
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Access Granted${userName ? `, ${userName}` : ''}</h1>
          <p>Your account is now active. Access the proving ground to begin building analytical acumen.</p>
          <p>Navigate to the Intelligence Library or deploy to your first scenario.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praxisplatform.com'}/dashboard" 
             style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Access Dashboard
          </a>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            Questions? Review the Intelligence Library or reach out to the support team.
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: userEmail,
    subject,
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
  const subject = status === 'approved' 
    ? 'Praxis Platform Application Approved' 
    : 'An Update on Your Praxis Application'

  const html = status === 'approved'
    ? `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #059669;">Application Approved</h1>
            <p>Your application has been approved. Full access to the Intelligence Library and simulation scenarios is now active.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praxisplatform.com'}/dashboard" 
               style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Access Platform
            </a>
          </div>
        </body>
      </html>
    `
    : `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Application Update</h1>
            <p>After careful review, we've determined there isn't a fit at this time. We encourage you to re-apply in six months as our program and your experience evolve.</p>
          </div>
        </body>
      </html>
    `

  return sendEmail({
    to: userEmail,
    subject,
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
  const subject = 'Subscription Confirmed - Praxis Platform'
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Subscription Confirmed!</h1>
          <p>${userName || 'Thank you'} for subscribing to <strong>${planName}</strong>.</p>
          <p>Your subscription is now active and you have access to all premium features.</p>
          <p>If you have any questions about your subscription, please contact our support team.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: userEmail,
    subject,
    html,
  })
}

