import { Button, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface WeeklySummaryEmailProps {
  userName?: string
  articlesCompleted?: number
  simulationsCompleted?: number
  lessonsCompleted?: number
  dashboardUrl?: string
}

export function WeeklySummaryEmail({
  userName,
  articlesCompleted = 0,
  simulationsCompleted = 0,
  lessonsCompleted = 0,
  dashboardUrl = 'https://execemy.com/dashboard',
}: WeeklySummaryEmailProps) {
  const totalActivities = articlesCompleted + simulationsCompleted + lessonsCompleted

  return (
    <EmailLayout preview="Your Weekly Execemy Summary">
      <Section style={content}>
        <Text style={heading}>Weekly Summary{userName ? `, ${userName}` : ''}</Text>
        <Text style={paragraph}>
          Here's your progress this week:
        </Text>
        
        <Section style={statsContainer}>
          {articlesCompleted > 0 && (
            <Text style={stat}>
              📚 <strong>{articlesCompleted}</strong> article{articlesCompleted !== 1 ? 's' : ''} completed
            </Text>
          )}
          {lessonsCompleted > 0 && (
            <Text style={stat}>
              📖 <strong>{lessonsCompleted}</strong> lesson{lessonsCompleted !== 1 ? 's' : ''} completed
            </Text>
          )}
          {simulationsCompleted > 0 && (
            <Text style={stat}>
              🎯 <strong>{simulationsCompleted}</strong> simulation{simulationsCompleted !== 1 ? 's' : ''} completed
            </Text>
          )}
          {totalActivities === 0 && (
            <Text style={stat}>
              No activities completed this week. Get started by exploring the Intelligence Library!
            </Text>
          )}
        </Section>

        <Text style={paragraph}>
          {totalActivities > 0 
            ? 'Keep up the momentum and continue building your executive skills.' 
            : 'Start your learning journey today.'}
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={dashboardUrl}>
            View Dashboard
          </Button>
        </Section>
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

const statsContainer = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const stat = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
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

