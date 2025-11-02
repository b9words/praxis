import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import * as React from 'react'

interface EmailLayoutProps {
  preview?: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'

  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Execemy</Heading>
          </Section>
          {children}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Execemy Platform. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href={`${baseUrl}/legal/privacy`} style={link}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href={`${baseUrl}/legal/terms`} style={link}>
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 24px',
  borderBottom: '1px solid #e5e7eb',
}

const logo = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0',
}

const footer = {
  padding: '24px',
  borderTop: '1px solid #e5e7eb',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

