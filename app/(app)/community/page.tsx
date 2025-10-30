import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyStateWithSuggestions } from '@/components/ui/empty-state'
import { prisma } from '@/lib/prisma/server'
import { BookOpen, MessageCircle, Target } from 'lucide-react'
import Link from 'next/link'

export default async function CommunityPage() {
  // Fetch all channels with thread counts
  const channels = await prisma.forumChannel.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  })

  // For each channel, get thread count
  const channelsWithCounts = await Promise.all(
    channels.map(async (channel) => {
      const threadCount = await prisma.forumThread.count({
        where: {
          channelId: channel.id,
        },
      })

      return { ...channel, threadCount }
    })
  )

  // Get recent threads across all channels
  const recentThreads = await prisma.forumThread.findMany({
    include: {
      author: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
      channel: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
        <p className="mt-2 text-gray-600">Connect with fellow Praxis members</p>
      </div>

      {/* Channels */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {channelsWithCounts.map((channel) => (
            <Link key={channel.id} href={`/community/${channel.slug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">#{channel.name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {channel.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{channel.threadCount} threads</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Threads */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Discussions</h2>
        <div className="space-y-3">
          {recentThreads.length > 0 ? (
            recentThreads.map((thread) => (
              <Link key={thread.id} href={`/community/${thread.channel.slug}/${thread.id}`}>
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{thread.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {thread.content.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>#{thread.channel.name}</span>
                          <span>•</span>
                          <span>by {thread.author.username}</span>
                          <span>•</span>
                          <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <EmptyStateWithSuggestions
              icon={MessageCircle}
              title="No discussions yet"
              description="The community is just getting started. Be among the first to share insights and connect with fellow learners."
              suggestions={[
                {
                  title: 'Start a Discussion',
                  description: 'Share a business insight or ask a question',
                  href: '/community/general/new',
                  icon: MessageCircle,
                },
                {
                  title: 'Read Articles First',
                  description: 'Get inspired by our business frameworks',
                  href: '/library',
                  icon: BookOpen,
                },
                {
                  title: 'Complete a Simulation',
                  description: 'Then discuss your experience',
                  href: '/simulations',
                  icon: Target,
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  )
}
