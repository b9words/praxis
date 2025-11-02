import { Button, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './EmailLayout'

interface SimulationCompleteEmailProps {
  caseTitle: string
  debriefUrl?: string
  userName?: string
}

export function SimulationCompleteEmail({
  caseTitle,
  debriefUrl = 'https://execemy.com/dashboard',
  userName,
}: SimulationCompleteEmailProps) {
  return (
    <EmailLayout preview={`Simulation Complete: ${caseTitle}`}>
      <Section style={content}>
        <Text style={heading}>Simulation Complete{userName ? `, ${userName}` : ''}</Text>
        <Text style={paragraph}>
          You've completed the <strong>{caseTitle}</strong> simulation.
        </Text>
        <Text style={paragraph}>
          Review your after-action report to see detailed feedback on your strategic decision-making and insights for improvement.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={debriefUrl}>
            View Debrief
          </Button>
        </Section>
        <Text style={footerText}>
          Continue building your analytical skills with more simulations in The Arena.
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
  backgroundColor: '#059669',
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

