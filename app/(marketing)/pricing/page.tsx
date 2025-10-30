import PublicHeader from '@/components/layout/PublicHeader'
import { SectionAccent } from '@/components/layout/SectionAccent'
import PaddleCheckout from '@/components/pricing/PaddleCheckout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing - Praxis',
  description: 'Choose the perfect plan for your business acumen journey. From Explorer to Executive, find the right level for your ambitions.',
  openGraph: {
    title: 'Pricing - Praxis',
    description: 'Choose the perfect plan for your business acumen journey. From Explorer to Executive, find the right level for your ambitions.',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://praxisplatform.com'}/pricing`,
  },
  twitter: {
    card: 'summary',
    title: 'Pricing - Praxis',
    description: 'Choose the perfect plan for your business acumen journey.',
  },
}

export default function PricingPage() {
  const plans = [
    {
      name: 'Explorer',
      price: '$49',
      period: '/month',
      planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_EXPLORER || '',
      description: 'Perfect for individuals starting their business acumen journey',
      features: [
        'Access to Year 1: Operator\'s Residency (16 articles, 4 cases)',
        'AI Study Assistant for all articles',
        'Unlimited simulation attempts',
        'AI-powered performance debriefs',
        'Community forum access',
        'Personal Praxis Profile'
      ],
      cta: 'Start Explorer',
      popular: false
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL || '',
      description: 'For ambitious professionals committed to mastery',
      features: [
        'Everything in Explorer, plus:',
        'Access to Years 1-3 curriculum (39 articles, 10 cases)',
        'Priority AI coaching with detailed feedback',
        'Advanced simulations with AI role-play',
        'Verified Praxis credential',
        'Career coaching sessions (2/month)',
        'Exclusive networking events'
      ],
      cta: 'Start Professional',
      popular: true
    },
    {
      name: 'Executive',
      price: '$199',
      period: '/month',
      planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_EXECUTIVE || '',
      description: 'Complete program for aspiring executives and leaders',
      features: [
        'Everything in Professional, plus:',
        'Full 5-year curriculum (52 articles, 14 cases)',
        'Executive-level simulations',
        '1-on-1 executive coaching (4/month)',
        'Custom learning paths',
        'Leadership assessment',
        'Alumni network access',
        'Lifetime credential updates'
      ],
      cta: 'Start Executive',
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-neutral-200 relative">
        <SectionAccent variant="vertical" className="opacity-30" />
        <SectionAccent variant="corner" className="top-24 opacity-20" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-light text-neutral-900 leading-tight tracking-tight">
              Invest in Your Business Acumen
            </h1>
            <p className="text-lg text-neutral-700 leading-relaxed">
              Choose the plan that fits your ambition. All plans include AI-powered coaching, interactive simulations, and community access.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-neutral-700" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-neutral-700" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="border-b border-neutral-200 bg-neutral-50 relative">
        <SectionAccent variant="edge" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <Card key={idx} className={`relative bg-white hover:border-neutral-300 transition-colors ${
                plan.popular 
                  ? 'border-2 border-neutral-900' 
                  : 'border border-neutral-200'
              }`}>
                <div className="absolute top-0 left-0 w-full h-[0.5px] bg-neutral-900 opacity-0 hover:opacity-20 transition-opacity"></div>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-neutral-900 text-white px-3 py-1 text-xs font-medium rounded-none">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-xl font-medium text-neutral-900 mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-neutral-600 mb-6">{plan.description}</CardDescription>
                  <div>
                    <span className="text-4xl font-light text-neutral-900 tracking-tight">{plan.price}</span>
                    <span className="text-sm text-neutral-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-neutral-700 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.planId ? (
                    <PaddleCheckout
                      planId={plan.planId}
                      planName={plan.name}
                      className={`w-full h-12 text-sm font-medium rounded-none ${
                        plan.popular 
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white' 
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                      }`}
                    >
                      {plan.cta}
                    </PaddleCheckout>
                  ) : (
                    <Button 
                      asChild 
                      className={`w-full h-12 text-sm font-medium rounded-none ${
                        plan.popular 
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white' 
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                      }`}
                    >
                      <Link href="/signup">{plan.cta}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Annual Discount */}
          <div className="mt-12 text-center">
            <div className="inline-block bg-neutral-100 border border-neutral-200 px-6 py-4">
              <p className="text-sm text-neutral-700">
                <span className="font-medium text-neutral-900">Save 20%</span> with annual billing
                <span className="mx-2">•</span>
                All plans include 7-day free trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-neutral-200 relative">
        <SectionAccent variant="vertical" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl mx-auto">
            <div className="mb-20 relative">
              <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
              <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">Frequently Asked Questions</h2>
            </div>
          
            <div className="space-y-6">
              {[
                {
                  q: 'What makes Praxis different from online courses?',
                  a: 'Praxis is not a course—it\'s a systematic training program. You don\'t just watch videos; you make real business decisions in simulated environments and receive AI-powered feedback on your performance. Our focus is on demonstrable skills, not passive learning.'
                },
                {
                  q: 'How much time does it require?',
                  a: 'Most members spend 3-5 hours per week. The curriculum is designed for working professionals—you can progress at your own pace and pause anytime.'
                },
                {
                  q: 'Do I need business experience?',
                  a: 'No. Our Year 1 curriculum assumes no prior business knowledge. We start with fundamentals and build systematically to executive-level topics.'
                },
                {
                  q: 'Is the Praxis credential recognized?',
                  a: 'Your Praxis Profile is a verified, skills-based credential that demonstrates competency through performance, not just completion. Many members share it on LinkedIn and with employers to demonstrate their business acumen.'
                },
                {
                  q: 'Can I switch plans later?',
                  a: 'Yes. Upgrade or downgrade anytime. You\'ll only lose access to content outside your new plan\'s scope.'
                },
                {
                  q: 'What if I\'m not satisfied?',
                  a: '30-day money-back guarantee, no questions asked. We\'re confident you\'ll see immediate value.'
                }
              ].map((faq, idx) => (
                <Card key={idx} className="bg-white border border-neutral-200 hover:border-neutral-300 transition-colors relative">
                  <div className="absolute top-0 left-0 w-full h-[0.5px] bg-neutral-900 opacity-0 hover:opacity-20 transition-opacity"></div>
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-neutral-900">{faq.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-700 leading-relaxed">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-neutral-900 text-white relative overflow-hidden">
        {/* Subtle diagonal pattern */}
        <div className="absolute inset-0 opacity-[0.015]">
          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonal-pricing" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40 L40 0" stroke="currentColor" strokeWidth="0.5" className="text-white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal-pricing)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl mx-auto text-center relative">
            <SectionAccent variant="center" />
            <h2 className="text-3xl font-light mb-6 tracking-tight">Ready to Start</h2>
            <p className="text-base text-neutral-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              Join the Praxis community today and start building world-class business acumen
            </p>
            <Button asChild size="lg" className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-none px-8 h-12 text-sm font-medium">
              <Link href="/signup">
                Request Access
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
