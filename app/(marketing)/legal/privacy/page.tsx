import type { Metadata } from 'next'
import Link from 'next/link'

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Execemy Platform. Learn how we collect, use, and protect your personal information.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy | Execemy',
    description: 'Privacy Policy for Execemy Platform. Learn how we collect, use, and protect your personal information.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'}/legal/privacy`,
    siteName: 'Execemy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | Execemy',
    description: 'Privacy Policy for Execemy Platform.',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-neutral-900 mb-8 tracking-tight">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-neutral-600 mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Execemy Platform ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
          <p>We collect information that you provide directly to us:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account information:</strong> Name, email address, username</li>
            <li><strong>Profile information:</strong> Full name, bio, avatar image</li>
            <li><strong>User-generated content:</strong> Content you create on the platform (simulation inputs, learning progress)</li>
            <li><strong>Payment information:</strong> Processed securely by Paddle (our payment processor). We do not store payment card details.</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
          <p>We automatically collect certain information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage analytics:</strong> Pages visited, features used, time spent, and engagement patterns</li>
            <li><strong>Device information:</strong> IP address, browser type, operating system</li>
            <li><strong>Cookies and tracking technologies:</strong> See our <Link href="/legal/cookies" className="text-neutral-700 hover:text-neutral-900 transition-colors">Cookie Policy</Link> for details</li>
            <li><strong>Learning progress:</strong> Lesson completion status, simulation results, competency scores</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Lawful Basis for Processing</h2>
          <p>We process your personal information based on the following lawful bases:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Contractual necessity:</strong> To provide the Service you have subscribed to</li>
            <li><strong>Legitimate interest:</strong> To improve our platform, analyze usage patterns, and enhance user experience</li>
            <li><strong>Consent:</strong> For marketing analytics cookies on our marketing pages (you can withdraw consent at any time)</li>
            <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our Service</li>
            <li>Process your account registration and manage your subscription</li>
            <li>Send you transactional emails and notifications (e.g., welcome emails, account updates)</li>
            <li>Personalize your learning experience and recommend relevant content</li>
            <li>Analyze usage patterns to improve our platform functionality and user experience</li>
            <li>Generate competency assessments and simulation debriefs</li>
            <li>Detect and prevent fraud, abuse, or security issues</li>
            <li>Comply with legal obligations and respond to legal requests</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Processors (Sub-processors)</h2>
          <p>We use the following third-party services that process your personal information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Supabase:</strong> Database hosting, user authentication, and file storage</li>
            <li><strong>Vercel:</strong> Web hosting and performance analytics</li>
            <li><strong>Paddle:</strong> Payment processing and subscription management</li>
            <li><strong>PostHog:</strong> Product analytics (used with consent on marketing pages only)</li>
            <li><strong>Replicate / OpenAI / Google (Vertex AI):</strong> AI model providers for generating simulation debriefs and content</li>
            <li><strong>Resend:</strong> Transactional email delivery</li>
            <li><strong>Sentry:</strong> Error tracking and monitoring</li>
          </ul>
          <p className="mt-4">
            All data processors are contractually required to protect your information and use it only for the purposes specified. 
            They are prohibited from using your personal information for their own purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Information Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With service providers (data processors) listed in Section 5 who assist in operating our Service</li>
            <li>When required by law, legal process, or to protect our rights and safety</li>
            <li>In connection with a business transfer, merger, or acquisition (with notice to users)</li>
            <li>With your explicit consent or at your direction</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
            over the Internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Your Rights (Data Subject Access Requests)</h2>
          <p>Depending on your location (GDPR, CCPA/CPRA, etc.), you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Right of Access:</strong> Request a copy of all personal information we hold about you</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete information</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your account and all associated data</li>
            <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for analytics cookies at any time</li>
          </ul>
          <p className="mt-4">
            You can exercise most of these rights directly through your account settings at{' '}
            <Link href="/profile/settings/privacy" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              /profile/settings/privacy
            </Link>
            . For other requests, please contact us at{' '}
            <a href="mailto:privacy@execemy.com" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              privacy@execemy.com
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies to track activity and store information. Essential cookies 
            are required for the Service to function. Analytics cookies on marketing pages require your consent. 
            You can control cookie preferences through the cookie consent banner or your browser settings. 
            See our{' '}
            <Link href="/legal/cookies" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              Cookie Policy
            </Link>{' '}
            for more details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our Service and fulfill
            the purposes described in this policy:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Account data:</strong> Retained while your account is active. Deleted upon account deletion request.</li>
            <li><strong>Transaction records:</strong> Retained for 7 years for tax and legal compliance (payment data via Paddle).</li>
            <li><strong>Usage analytics:</strong> Aggregated and anonymized after 25 months.</li>
            <li><strong>Legal obligations:</strong> We may retain certain information longer if required by law or for legitimate business purposes.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 18. We do not knowingly collect personal information
            from children. If we become aware that we have collected information from a child, we will take
            steps to delete it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence
            (e.g., Supabase servers may be located in the United States). We ensure appropriate safeguards are in 
            place through Standard Contractual Clauses (SCCs) and compliance with GDPR and other applicable data 
            protection laws to protect your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes
            by posting the new policy on this page, updating the "Last updated" date, and, where appropriate,
            notifying you via email or through the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{' '}
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
            <Link href="/legal/cookies" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
