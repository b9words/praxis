import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import PaddleCheckout from '@/components/pricing/PaddleCheckout'
import ManageBillingButton from './ManageBillingButton'

const PLANS = [
  {
    name: 'Explorer',
    price: '$49',
    period: '/month',
    planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_EXPLORER || '',
    description: 'Perfect for individuals starting their business acumen journey',
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_PROFESSIONAL || '',
    description: 'For ambitious professionals committed to mastery',
  },
  {
    name: 'Executive',
    price: '$199',
    period: '/month',
    planId: process.env.NEXT_PUBLIC_PADDLE_PLAN_EXECUTIVE || '',
    description: 'Complete program for aspiring executives and leaders',
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
                          {plan.planId ? (
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
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">No Active Subscription</h2>
            <p className="text-xs text-gray-500 mt-1">You don't have an active subscription</p>
          </div>
          <div className="p-6">
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
              <a href="/pricing">View Plans</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

