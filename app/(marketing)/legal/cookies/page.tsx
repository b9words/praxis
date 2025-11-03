import PublicHeader from '@/components/layout/PublicHeader'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cookie Policy for Execemy Platform. Learn about how we use cookies and tracking technologies.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Cookie Policy | Execemy',
    description: 'Cookie Policy for Execemy Platform. Learn about how we use cookies and tracking technologies.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'}/legal/cookies`,
    siteName: 'Execemy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Cookie Policy | Execemy',
    description: 'Cookie Policy for Execemy Platform.',
  },
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-neutral-900 mb-8 tracking-tight">Cookie Policy</h1>
      
      <div className="prose prose-lg max-w-none">
            <p className="text-sm text-neutral-600 mb-8">
          Last updated: November 3, 2024
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your device when you visit our website. They help
            us provide you with a better experience by remembering your preferences and analyzing how you use
            our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>
          
          <h3 className="text-xl font-semibold mb-3">2.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the Service to function properly. They enable core functionality
            such as authentication, security, and session management.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Analytics Cookies</h3>
          <p>
            We use analytics cookies (via PostHog) to understand how users interact with our Service. This
            helps us improve performance and user experience. These cookies collect anonymous information
            about page views and user behavior.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Functional Cookies</h3>
          <p>
            These cookies remember your preferences and settings (such as theme preferences, language choices)
            to provide a personalized experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
          <p>We may use third-party services that set cookies:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>PostHog:</strong> Analytics and product insights</li>
            <li><strong>Supabase:</strong> Authentication and database sessions</li>
            <li><strong>Vercel:</strong> Performance monitoring and analytics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
          <p>You can control and manage cookies in several ways:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or delete cookies through settings</li>
            <li><strong>Opt-Out:</strong> You can opt out of analytics cookies through your account preferences</li>
            <li><strong>Do Not Track:</strong> Your browser may support "Do Not Track" signals</li>
          </ul>
          <p className="mt-4">
            Note: Disabling cookies may impact your ability to use certain features of our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookie Duration</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Session Cookies:</strong> Temporary cookies deleted when you close your browser</li>
            <li><strong>Persistent Cookies:</strong> Remain on your device for a set period or until deleted</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will be posted on this page
            with an updated revision date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, please contact us at{' '}
            <a href="mailto:privacy@execemy.com" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              privacy@execemy.com
            </a>
          </p>
        </section>
      </div>

          <div className="mt-12 pt-8 border-t border-neutral-200">
            <Link href="/legal/terms" className="text-neutral-700 hover:text-neutral-900 transition-colors mr-4">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
