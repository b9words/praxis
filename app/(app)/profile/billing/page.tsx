import CheckoutButton from '@/components/pricing/CheckoutButton'
import MockCheckout from '@/components/pricing/MockCheckout'
import PaddleCheckout from '@/components/pricing/PaddleCheckout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isMissingTable } from '@/lib/api/route-helpers'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { Check } from 'lucide-react'
import ManageBillingButton from './ManageBillingButton'

const ENABLE_MOCK_CHECKOUT = process.env.NEXT_PUBLIC_ENABLE_MOCK_CHECKOUT === 'true'

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'

const PLANS = [
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
      'Personal Execemy Profile'
    ],
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
      'Verified Execemy credential',
      'Career coaching sessions (2/month)',
      'Exclusive networking events'
    ],
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
    popular: false
  },
]

function getPlanName(planId: string): string {
  const plan = PLANS.find(p => p.planId === planId)
  return plan?.name || planId
}

export default async function BillingPage() {
  const user = await getCurrentUser()

  // Auth protection is handled by middleware
  if (!user) {
    return null
  }

  let subscription: any = null
  try {
    subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })
  } catch (error: any) {
    if (!isMissingTable(error)) {
    console.error('Error fetching subscription:', error)
    }
  }

  const currentPlan = subscription ? PLANS.find(p => p.planId === subscription.paddlePlanId) : null
  const otherPlans = PLANS.filter(p => !subscription || p.planId !== subscription.paddlePlanId)

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Subscription & Billing</h1>
      </div>

      {subscription ? (
        <div className="space-y-6">
          {/* Current Engagement Plan */}
          <div className="bg-white border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Current Engagement Plan</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Plan</p>
                  <p className="text-lg font-medium text-gray-900">{currentPlan?.name || getPlanName(subscription.paddlePlanId)} Plan</p>
                  <p className="text-sm text-gray-600 mt-1">{currentPlan?.price}{currentPlan?.period}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</p>
                  <p className="text-sm text-gray-900 capitalize">Status: Active</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Renewal Date</p>
                <p className="text-sm text-gray-900">
                  Renews on: {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <ManageBillingButton />
              <p className="text-xs text-gray-500 mt-2">You will be redirected to our secure payment partner, Paddle, to manage your subscription.</p>
            </div>
          </div>

          {/* Adjust Engagement Level */}
          {otherPlans.length > 0 && (
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">Adjust Engagement Level</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {otherPlans.map((plan) => {
                    const isUpgrade = !currentPlan || (
                      plan.name === 'Professional' && currentPlan.name === 'Explorer'
                    ) || (
                      plan.name === 'Executive' && (currentPlan.name === 'Explorer' || currentPlan.name === 'Professional')
                    )
                    
                    return (
                      <Card key={plan.name} className="border-gray-300">
                        <CardHeader>
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          <CardDescription className="text-sm">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <span className="text-2xl font-light text-gray-900">{plan.price}</span>
                            <span className="text-sm text-gray-600">{plan.period}</span>
                          </div>
                          {ENABLE_MOCK_CHECKOUT ? (
                            <MockCheckout
                              planName={plan.name}
                              className={`w-full rounded-none ${
                                isUpgrade
                                  ? 'bg-gray-900 hover:bg-gray-800 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                              }`}
                            >
                              {isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`}
                            </MockCheckout>
                          ) : plan.planId && plan.planId.trim() !== '' ? (
                            <PaddleCheckout
                              planId={plan.planId}
                              planName={plan.name}
                              className={`w-full rounded-none ${
                                isUpgrade
                                  ? 'bg-gray-900 hover:bg-gray-800 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                              }`}
                            >
                              {isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`}
                            </PaddleCheckout>
                          ) : (
                            <Button disabled className="w-full rounded-none bg-gray-100 text-gray-900">
                              Plan Unavailable
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Choose Your Plan</h2>
              <p className="text-xs text-gray-500 mt-1">Select an engagement level to get started</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                  <Card
                    key={plan.name}
                    className={`relative bg-white hover:border-gray-300 transition-colors ${
                      plan.popular 
                        ? 'border-2 border-gray-900' 
                        : 'border border-gray-200'
                    }`}
                  >
                    <div className="absolute top-0 left-0 w-full h-[0.5px] bg-gray-900 opacity-0 hover:opacity-20 transition-opacity"></div>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gray-900 text-white px-3 py-1 text-xs font-medium rounded-none">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-8 pt-6">
                      <CardTitle className="text-xl font-medium text-gray-900 mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-sm text-gray-600 mb-6">{plan.description}</CardDescription>
                      <div>
                        <span className="text-4xl font-light text-gray-900 tracking-tight">{plan.price}</span>
                        <span className="text-sm text-gray-600">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <Check className="w-4 h-4 text-gray-700 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.planId && plan.planId.trim() !== '' ? (
                        <CheckoutButton
                          planId={ENABLE_MOCK_CHECKOUT ? undefined : plan.planId}
                          planName={plan.name}
                          price={plan.price}
                          period={plan.period}
                          isMock={ENABLE_MOCK_CHECKOUT}
                          variant="new"
                          className={`w-full h-12 text-sm font-medium rounded-none ${
                            plan.popular 
                              ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                          }`}
                        >
                          Start {plan.name}
                        </CheckoutButton>
                      ) : (
                        <Button disabled className={`w-full h-12 text-sm font-medium rounded-none ${
                          plan.popular 
                            ? 'bg-gray-900 hover:bg-gray-800 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}>
                          Plan Unavailable
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Annual Discount */}
              <div className="mt-8 text-center">
                <div className="inline-block bg-gray-50 border border-gray-200 px-6 py-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">Save 20%</span> with annual billing
                    <span className="mx-2">•</span>
                    All plans include 7-day free trial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

