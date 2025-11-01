import { prisma } from '@/lib/prisma/server'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default async function CommunityPage() {
  // Fetch all channels with thread counts with error handling
  let channels: any[] = []
  try {
    channels = await prisma.forumChannel.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })
  } catch (error) {
    console.error('Error fetching channels:', error)
  }

  // For each channel, get thread count with error handling
  let channelsWithCounts: any[] = []
  try {
    channelsWithCounts = await Promise.all(
      channels.map(async (channel: any) => {
        try {
          const threadCount = await prisma.forumThread.count({
            where: {
              channelId: channel.id,
            },
          })
          return { ...channel, threadCount }
        } catch (error) {
          console.error(`Error fetching thread count for channel ${channel.id}:`, error)
          return { ...channel, threadCount: 0 }
        }
      })
    )
  } catch (error) {
    console.error('Error processing channels:', error)
  }

  // Get recent threads across all channels with error handling
  let recentThreads: any[] = []
  try {
    recentThreads = await prisma.forumThread.findMany({
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
    // Handle missing metadata column (P2022) or other schema issues
    if (error?.code === 'P2022' || error?.message?.includes('metadata') || error?.message?.includes('does not exist')) {
      try {
        // Fallback: explicit select without problematic columns
        recentThreads = await prisma.forumThread.findMany({
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
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
      } catch (fallbackError) {
        console.error('Error fetching recent threads (fallback):', fallbackError)
      }
    } else {
      console.error('Error fetching recent threads:', error)
    }
  }

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
