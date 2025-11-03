import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { redirect } from 'next/navigation'
import { cache, CacheTags } from '@/lib/cache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminSubscriptionsPage() {
  // Cache subscriptions list (5 minutes revalidate)
  const getCachedSubscriptions = cache(
    async () => {
      // Wrap with error handling for missing tables (P2021)
      let subscriptions: any[] = []
      try {
        subscriptions = await prisma.subscription.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      } catch (error: any) {
        if (isMissingTable(error)) {
          subscriptions = []
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('[admin/subscriptions] Error fetching subscriptions:', error)
          }
          subscriptions = []
        }
      }
      
      return subscriptions
    },
    ['admin', 'system', 'subscriptions'],
    {
      tags: [CacheTags.ADMIN, CacheTags.SYSTEM],
      revalidate: 300, // 5 minutes
    }
  )
  
  const subscriptions = await getCachedSubscriptions()

  const activeCount = subscriptions.filter((s) => s.status === 'active').length
  const cancelledCount = subscriptions.filter((s) => s.status === 'cancelled').length

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Subscriptions</h1>
        <p className="text-sm text-gray-600">Manage user subscriptions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>{subscriptions.length} total subscriptions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subscription.user.username}</div>
                      {subscription.user.fullName && (
                        <div className="text-sm text-gray-500">{subscription.user.fullName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={subscription.status === 'active' ? 'default' : 'outline'}
                      >
                        {subscription.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subscription.paddlePlanId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

