import { cache, CacheTags } from '@/lib/cache'
import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { MessageCircle } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The Exchange | Execemy Community',
  description: 'Connect with operatives in the network, share insights, and engage in discussions',
}

export default async function CommunityPage() {
  // Cache channels list (15 minutes revalidate)
  const getCachedChannels = cache(
    async () => {
      let channels: any[] = []
      try {
        channels = await (prisma as any).forumChannel.findMany({
          orderBy: {
            createdAt: 'asc',
          },
        })
      } catch (error: any) {
        if (!isMissingTable(error)) {
          console.error('Error fetching channels:', error)
        }
      }

      // For each channel, get thread count with error handling (parallelize)
      const channelsWithCounts = await Promise.all(
        channels.map(async (channel: any) => {
          let threadCount = 0
          try {
            threadCount = await (prisma as any).forumThread.count({
              where: { channelId: channel.id },
            })
          } catch (error: any) {
            if (!isMissingTable(error)) {
              console.error(`Error fetching thread count for channel ${channel.id}:`, error)
            }
          }
          return { ...channel, threadCount }
        })
      )

      return channelsWithCounts
    },
    ['community', 'channels', 'all'],
    {
      tags: [CacheTags.FORUM, CacheTags.COMMUNITY],
      revalidate: 900, // 15 minutes
    }
  )

  // Cache recent threads (2 minutes revalidate)
  const getCachedRecentThreads = cache(
    async () => {
      let recentThreads: any[] = []
      try {
        recentThreads = await (prisma as any).forumThread.findMany({
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
      } catch (error: any) {
        if (!isMissingTable(error)) {
          console.error('Error fetching recent threads:', error)
        }
      }
      return recentThreads
    },
    ['community', 'threads', 'recent'],
    {
      tags: [CacheTags.FORUM, CacheTags.COMMUNITY],
      revalidate: 120, // 2 minutes
    }
  )

  const [channelsWithCounts, recentThreads] = await Promise.all([
    getCachedChannels(),
    getCachedRecentThreads(),
  ])

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">The Exchange</h1>
        <p className="text-sm text-gray-600">Connect with operatives in the network</p>
      </div>

      {/* Channels */}
      <div className="mb-12">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900">Channels</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {channelsWithCounts.map((channel) => (
            <Link key={channel.id} href={`/community/${channel.slug}`}>
              <div className="bg-white border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                <h3 className="text-base font-medium text-gray-900 mb-2">#{channel.name}</h3>
                {channel.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {channel.description}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  {channel.threadCount} {channel.threadCount === 1 ? 'thread' : 'threads'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Threads */}
      <div>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Discussions</h2>
            <Link href="/community/general/new" className="text-sm text-gray-700 hover:text-gray-900 transition-colors">
              Open a New Thread
            </Link>
          </div>
        </div>
        {recentThreads.length > 0 ? (
          <div className="bg-white border border-gray-200">
            <div className="divide-y divide-gray-100">
              {recentThreads.map((thread) => (
                <Link key={thread.id} href={`/community/${thread.channel.slug}/${thread.id}`}>
                  <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-medium text-gray-900 mb-1">{thread.title}</h3>
                        {thread.content && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {thread.content.substring(0, 200)}
                            {thread.content.length > 200 && '...'}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>#{thread.channel.name}</span>
                          <span>•</span>
                          <span>{thread.author.username}</span>
                          <span>•</span>
                          <span>{new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 p-12 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No discussions yet</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Be among the first to share insights and connect with fellow analysts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/community/general/new"
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-none text-sm font-medium transition-colors"
              >
                Open a New Thread
              </Link>
              <Link
                href="/library/curriculum"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-none text-sm font-medium transition-colors"
              >
                Browse Intelligence
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
