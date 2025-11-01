'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading: loading, error } = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: ({ signal }) => fetchJson<{ notifications: Notification[]; unreadCount: number }>('/api/notifications?limit=20', { signal }),
    refetchInterval: 30000,
    retry: 1,
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds: string[]) =>
      fetchJson('/api/notifications', {
        method: 'PATCH',
        body: { notificationIds },
      }),
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all() })
      const previous = queryClient.getQueryData<{ notifications: Notification[]; unreadCount: number }>(
        queryKeys.notifications.all()
      )

      if (previous) {
        queryClient.setQueryData(queryKeys.notifications.all(), {
          notifications: previous.notifications.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, previous.unreadCount - notificationIds.filter((id) =>
            previous.notifications.find((n) => n.id === id && !n.read)
          ).length),
        })
      }

      return { previous }
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all(), context.previous)
      }
      toast.error(error instanceof Error ? error.message : 'Failed to mark notifications as read')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      fetchJson('/api/notifications', {
        method: 'PATCH',
        body: { markAllAsRead: true },
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all() })
      const previous = queryClient.getQueryData<{ notifications: Notification[]; unreadCount: number }>(
        queryKeys.notifications.all()
      )

      if (previous) {
        queryClient.setQueryData(queryKeys.notifications.all(), {
          notifications: previous.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })
      }

      return { previous }
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all(), context.previous)
      }
      toast.error(error instanceof Error ? error.message : 'Failed to mark all as read')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() })
    },
  })

  const markAsRead = (notificationIds: string[]) => {
    markAsReadMutation.mutate(notificationIds)
  }

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id])
    }
    setOpen(false)
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full"
          aria-label="Notifications"
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-700 mb-2">Failed to load notifications</p>
              <p className="text-xs text-gray-500">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {/* Unread notifications */}
              {unreadNotifications.length > 0 && (
                <div>
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              )}

              {/* Read notifications */}
              {readNotifications.length > 0 && (
                <div className="opacity-60">
                  {readNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/notifications">View all notifications</Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification
  onClick: () => void
}) {
  const content = notification.link ? (
    <Link href={notification.link} onClick={onClick} className="block">
      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
        <div className="flex items-start gap-3">
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(notification.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  ) : (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {!notification.read && (
          <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )

  return content
}

