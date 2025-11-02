import { Button, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './EmailLayout'

interface GeneralNotificationEmailProps {
  title: string
  message: string
  actionUrl?: string
  actionText?: string
  userName?: string
}

export function GeneralNotificationEmail({
  title,
  message,
  actionUrl,
  actionText = 'View Details',
  userName,
}: GeneralNotificationEmailProps) {
  return (
    <EmailLayout preview={title}>
      <Section style={content}>
        <Text style={heading}>{title}{userName ? `, ${userName}` : ''}</Text>
        <Text style={paragraph}>{message}</Text>
        {actionUrl && (
          <Section style={buttonContainer}>
            <Button style={button} href={actionUrl}>
              {actionText}
            </Button>
          </Section>
        )}
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

