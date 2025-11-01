import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { handleManageBilling } from './actions'

export default async function BillingPage() {
  const user = await getCurrentUser()

  // Auth protection is handled by middleware
  if (!user) {
    return null
  }

  let subscription = null
  try {
    subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
  }


  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-sm text-gray-600">Manage your subscription and billing information</p>
      </div>

      {subscription ? (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Current Subscription</h2>
            <p className="text-xs text-gray-500 mt-1">Your active subscription details</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</p>
                <p className="text-sm text-gray-900 capitalize">{subscription.status}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Plan ID</p>
                <p className="text-sm text-gray-900">{subscription.paddlePlanId}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Current Period</p>
              <p className="text-sm text-gray-900">
                {new Date(subscription.currentPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} -{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <form action={handleManageBilling as any}>
              <Button type="submit" variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">
                Manage Billing Portal
              </Button>
            </form>
          </div>
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

