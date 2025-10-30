import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'
import { handleManageBilling } from './actions'

export default async function BillingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your subscription and billing information</p>
        </div>

        {subscription ? (
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Status</p>
                  <p className="text-sm text-gray-600 capitalize">{subscription.status}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Plan ID</p>
                  <p className="text-sm text-gray-600">{subscription.paddlePlanId}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Current Period</p>
                  <p className="text-sm text-gray-600">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <form action={handleManageBilling as any}>
                <Button type="submit" variant="outline">
                  Manage Billing Portal
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>You don't have an active subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/pricing">View Plans</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

