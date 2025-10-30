'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Thread {
  id: string
  title: string
  slug: string
  created_at: string
  author: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  reply_count: number
}

interface CommunityFeedProps {
  threads: Thread[]
}

export default function CommunityFeed({ threads }: CommunityFeedProps) {
  if (!threads || threads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Activity</CardTitle>
          <CardDescription>Latest discussions from the exchange</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No recent discussions</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/community">Open a Thread</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Network Activity
          </CardTitle>
          <CardDescription>Latest discussions from the exchange</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/community">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {threads.slice(0, 5).map((thread) => {
          const displayName = thread.author.full_name || thread.author.username
          const initials = displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
          const timeAgo = getTimeAgo(new Date(thread.created_at))

          return (
            <Link
              key={thread.id}
              href={`/community/${thread.slug}`}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={thread.author.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {thread.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{displayName}</span>
                  <span>•</span>
                  <span>{timeAgo}</span>
                  {thread.reply_count > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{thread.reply_count}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 604800)}w ago`
}

