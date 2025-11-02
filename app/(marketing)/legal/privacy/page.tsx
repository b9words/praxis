import PublicHeader from '@/components/layout/PublicHeader'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - Execemy',
  description: 'Privacy Policy for Execemy Platform',
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
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
            <li>Account information (name, email, username)</li>
            <li>Application information (motivation, background)</li>
            <li>Profile information (bio, avatar)</li>
            <li>Content you create (forum posts, comments)</li>
            <li>Payment information (processed by Paddle, not stored by us)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
          <p>We automatically collect certain information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Learning progress and simulation results</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our Service</li>
            <li>Process your account registration and application</li>
            <li>Send you transactional emails and notifications</li>
            <li>Personalize your learning experience</li>
            <li>Analyze usage patterns to improve our platform</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With service providers who assist in operating our Service (hosting, analytics, email)</li>
            <li>When required by law or to protect our rights</li>
            <li>In connection with a business transfer or merger</li>
            <li>With your consent or at your direction</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
            over the Internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to processing of your information</li>
            <li>Data portability</li>
            <li>Withdraw consent</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@execemy.com" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              privacy@execemy.com
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies to track activity and store information. You can control
            cookie preferences through your browser settings. See our{' '}
            <Link href="/legal/cookies" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              Cookie Policy
            </Link>{' '}
            for more details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our Service and fulfill
            the purposes described in this policy. We may retain certain information for legal compliance
            or legitimate business purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 18. We do not knowingly collect personal information
            from children. If we become aware that we have collected information from a child, we will take
            steps to delete it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence.
            We ensure appropriate safeguards are in place to protect your information in accordance with this policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
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
