import { Button, Section, Text } from '@react-email/components'
import { EmailLayout } from './EmailLayout'

interface WeeklySummaryEmailProps {
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

export function WeeklySummaryEmail({
  userName,
  articlesCompleted = 0,
  simulationsCompleted = 0,
  lessonsCompleted = 0,
  dashboardUrl = 'https://execemy.com/dashboard',
  strongestCompetency,
  simulatorTimeMinutes,
  simulatorTimeChangePct,
  recommendedContent = [],
}: WeeklySummaryEmailProps) {
  const totalActivities = articlesCompleted + simulationsCompleted + lessonsCompleted
  const hasInsights = strongestCompetency || simulatorTimeMinutes !== undefined

  // Format simulator time: round to nearest 5 minutes, display as hours:mins
  const formatSimulatorTime = (minutes: number): string => {
    const rounded = Math.round(minutes / 5) * 5
    const hours = Math.floor(rounded / 60)
    const mins = rounded % 60
    if (hours === 0) return `${mins} minutes`
    if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`
    return `${hours}h ${mins}m`
  }

  // Format percent change with sign
  const formatPercentChange = (pct: number): string => {
    const sign = pct >= 0 ? '+' : ''
    return `${sign}${Math.round(pct)}%`
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'
  
  return (
    <EmailLayout preview="Your Weekly Briefing" showUnsubscribe unsubscribeUrl={`${baseUrl}/profile/settings/notifications`}>
      <Section style={content}>
        <Text style={heading}>Weekly Briefing{userName ? `, ${userName}` : ''}</Text>
        <Text style={paragraph}>
          Performance data from the past week:
        </Text>
        
        <Section style={statsContainer}>
          {strongestCompetency && (
            <Text style={stat}>
              <strong>Strongest competency:</strong> {strongestCompetency}
            </Text>
          )}
          {simulatorTimeMinutes !== undefined && (
            <Text style={stat}>
              <strong>Simulator time:</strong> {formatSimulatorTime(simulatorTimeMinutes)}
              {simulatorTimeChangePct !== undefined && (
                <span> ({formatPercentChange(simulatorTimeChangePct)} vs last week)</span>
              )}
            </Text>
          )}
          {articlesCompleted > 0 && (
            <Text style={stat}>
              <strong>{articlesCompleted}</strong> article{articlesCompleted !== 1 ? 's' : ''} completed
            </Text>
          )}
          {lessonsCompleted > 0 && (
            <Text style={stat}>
              <strong>{lessonsCompleted}</strong> lesson{lessonsCompleted !== 1 ? 's' : ''} completed
            </Text>
          )}
          {simulationsCompleted > 0 && (
            <Text style={stat}>
              <strong>{simulationsCompleted}</strong> case stud{simulationsCompleted !== 1 ? 'ies' : 'y'} completed
            </Text>
          )}
          {totalActivities === 0 && !hasInsights && (
            <Text style={stat}>
              No activities completed this week. Start your first case study.
            </Text>
          )}
        </Section>

        {recommendedContent.length > 0 && (
          <Section style={recommendationsContainer}>
            <Text style={recommendationsHeading}>Recommended for Next Week</Text>
            {recommendedContent.map((item, idx) => (
              <Section key={idx} style={recommendationItem}>
                <Text style={recommendationTitle}>{item.title}</Text>
                {item.reason && (
                  <Text style={recommendationReason}>{item.reason}</Text>
                )}
                <Button style={recommendationButton} href={`${baseUrl}${item.url}`}>
                  {item.type === 'lesson' ? 'View Lesson' : 'Start Case Study'}
                </Button>
              </Section>
            ))}
          </Section>
        )}

        <Text style={paragraph}>
          {totalActivities > 0 || hasInsights
            ? 'Continue building analytical acumen.' 
            : 'Begin your analytical journey.'}
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={dashboardUrl}>
            Resume Learning
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

const recommendationsContainer = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const recommendationsHeading = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const recommendationItem = {
  backgroundColor: '#ffffff',
  borderLeft: '3px solid #2563eb',
  borderRadius: '4px',
  padding: '16px',
  margin: '12px 0',
}

const recommendationTitle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '500',
  lineHeight: '24px',
  margin: '0 0 8px',
}

const recommendationReason = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
}

const recommendationButton = {
  backgroundColor: '#2563eb',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 16px',
}

