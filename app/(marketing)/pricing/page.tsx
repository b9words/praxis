import PaddleCheckout from '@/components/pricing/PaddleCheckout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

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
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-neutral-900">
              Praxis
            </Link>
            <div className="flex gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800 text-white">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-neutral-900 mb-6">
            Invest in Your Business Acumen
          </h1>
          <p className="text-xl text-neutral-600 mb-8">
            Choose the plan that fits your ambition. All plans include AI-powered coaching, interactive simulations, and community access.
          </p>
          <div className="flex justify-center gap-4 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <Card key={idx} className={`relative ${
                plan.popular 
                  ? 'border-2 border-blue-700 shadow-lg' 
                  : 'border border-neutral-200'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-700 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-neutral-600 mb-6">{plan.description}</CardDescription>
                  <div>
                    <span className="text-5xl font-bold text-neutral-900">{plan.price}</span>
                    <span className="text-neutral-600">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-neutral-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.planId ? (
                    <PaddleCheckout
                      planId={plan.planId}
                      planName={plan.name}
                      className={`w-full h-12 text-base ${
                        plan.popular 
                          ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                      }`}
                    >
                      {plan.cta}
                    </PaddleCheckout>
                  ) : (
                    <Button 
                      asChild 
                      className={`w-full h-12 text-base ${
                        plan.popular 
                          ? 'bg-blue-700 hover:bg-blue-800 text-white' 
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
            <Card className="inline-block bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm text-neutral-700">
                  <span className="font-semibold text-blue-700">Save 20%</span> with annual billing
                  <span className="mx-2">•</span>
                  All plans include 7-day free trial
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">Frequently Asked Questions</h2>
          
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
              <Card key={idx} className="bg-white border-neutral-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-neutral-900">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-700 leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-neutral-900 mb-6">
            Ready to Start?
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            Join the Praxis community today and start building world-class business acumen
          </p>
          <Button asChild size="lg" className="bg-blue-700 hover:bg-blue-800 text-white px-10 h-14 text-lg">
            <Link href="/signup">
              Get Started Free
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-8 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>&copy; 2025 Praxis Program, Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}


