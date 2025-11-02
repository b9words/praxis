import PublicHeader from '@/components/layout/PublicHeader'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - Execemy',
  description: 'Terms of Service for Execemy Platform',
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light text-neutral-900 mb-8 tracking-tight">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-neutral-600 mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Execemy Platform ("Service"), you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>
            Execemy Platform provides executive education and business simulation services. We reserve the right
            to modify, suspend, or discontinue any part of the Service at any time with or without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p>
            To access certain features of the Service, you must register for an account. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your account information</li>
            <li>Maintain the security of your password</li>
            <li>Accept all responsibility for activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>
          <p>
            If you purchase a subscription, you agree to pay all fees associated with your subscription.
            Subscriptions automatically renew unless cancelled. We reserve the right to change our pricing
            with 30 days notice to existing subscribers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of the Service, including but not limited to text, graphics,
            logos, and software, are the exclusive property of Execemy Platform and are protected by international
            copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. User Content</h2>
          <p>
            You retain ownership of any content you submit to the Service. By submitting content, you grant
            us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content
            solely for the purpose of providing and improving the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
          <p>You may not use the Service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>In any way that violates applicable laws or regulations</li>
            <li>To transmit any malicious code or viruses</li>
            <li>To impersonate or attempt to impersonate another user</li>
            <li>To engage in any activity that interferes with or disrupts the Service</li>
            <li>To collect or harvest any information from other users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" without warranties of any kind, either express or implied.
            We do not warrant that the Service will be uninterrupted, secure, or error-free.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Execemy Platform shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages resulting from your use of the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice,
            for conduct that we believe violates these Terms of Service or is harmful to other users, us, or
            third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. We will notify users of any
            material changes via email or through the Service. Your continued use of the Service after such
            modifications constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:legal@execemy.com" className="text-neutral-700 hover:text-neutral-900 transition-colors">
              legal@execemy.com
            </a>
          </p>
        </section>
      </div>

          <div className="mt-12 pt-8 border-t border-neutral-200">
            <Link href="/legal/privacy" className="text-neutral-700 hover:text-neutral-900 transition-colors mr-4">
              Privacy Policy
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

