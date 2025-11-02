'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
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
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Network Activity</h2>
          <p className="text-xs text-gray-500 mt-1">Latest discussions from The Exchange</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">No recent discussions</p>
          <Button asChild size="sm" className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            <Link href="/community">Open a Thread</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Network Activity</h2>
            <p className="text-xs text-gray-500 mt-1">Latest discussions from The Exchange</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-900 rounded-none p-0 h-auto">
            <Link href="/community">View All</Link>
          </Button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
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
              className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <Avatar className="h-8 w-8 border border-gray-200">
                <AvatarImage src={thread.author.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-gray-100 text-gray-700">{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors line-clamp-1">
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
      </div>
    </div>
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
