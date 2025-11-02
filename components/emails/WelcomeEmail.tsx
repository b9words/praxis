import { Button, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface WelcomeEmailProps {
  userName?: string
  loginUrl?: string
}

export function WelcomeEmail({ userName, loginUrl = 'https://execemy.com/dashboard' }: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Access Granted — Welcome to Execemy">
      <Section style={content}>
        <Text style={heading}>Access Granted{userName ? `, ${userName}` : ''}</Text>
        <Text style={paragraph}>
          Your account is active. Access the proving ground to begin building analytical acumen.
        </Text>
        <Text style={paragraph}>
          Navigate to the Intelligence Library or deploy to your first scenario.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Access Dashboard
          </Button>
        </Section>
        <Text style={footerText}>
          Questions? Review the Intelligence Library or reach out to the support team.
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
  backgroundColor: '#111827',
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

