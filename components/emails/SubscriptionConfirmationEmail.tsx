import { Button, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface SubscriptionConfirmationEmailProps {
  planName: string
  userName?: string
  dashboardUrl?: string
}

export function SubscriptionConfirmationEmail({
  planName,
  userName,
  dashboardUrl = 'https://execemy.com/dashboard',
}: SubscriptionConfirmationEmailProps) {
  return (
    <EmailLayout preview="Subscription Confirmed - Execemy Platform">
      <Section style={content}>
        <Text style={heading}>Subscription Confirmed!{userName ? `, ${userName}` : ''}</Text>
        <Text style={paragraph}>
          Thank you for subscribing to <strong>{planName}</strong>.
        </Text>
        <Text style={paragraph}>
          Your subscription is now active and you have access to all premium features.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={dashboardUrl}>
            Access Premium Features
          </Button>
        </Section>
        <Text style={footerText}>
          If you have any questions about your subscription, please contact our support team.
        </Text>
      </Section>
    </EmailLayout>
  )
}

const content = {
  padding: '48px 24px',
}

const heading = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 16px',
}

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const buttonContainer = {
  padding: '24px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '32px 0 0',
}

