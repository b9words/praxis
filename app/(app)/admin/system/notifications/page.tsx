import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { redirect } from 'next/navigation'
import { cache, CacheTags } from '@/lib/cache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminNotificationsPage() {
  // Cache notifications (1 minute revalidate)
  const getCachedNotifications = cache(
    async () => {
      // Wrap with error handling for missing tables (P2021)
      let notifications: any[] = []
      try {
        notifications = await prisma.notification.findMany({
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        })
      } catch (error: any) {
        if (isMissingTable(error)) {
          notifications = []
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('[admin/notifications] Error fetching notifications:', error)
          }
          notifications = []
        }
      }
      
      return notifications
    },
    ['admin', 'system', 'notifications'],
    {
      tags: [CacheTags.ADMIN, CacheTags.SYSTEM],
      revalidate: 60, // 1 minute
    }
  )
  
  const notifications = await getCachedNotifications()

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Notifications</h1>
        <p className="text-sm text-gray-600">View and manage system notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications ({notifications.length})</CardTitle>
          <CardDescription>{unreadCount} unread</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <Badge variant="outline" className="text-xs">Unread</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="text-xs text-gray-500">
                      To: {notification.user.username} • {notification.type} • {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

