import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { slug } = await params

  // Fetch channel with error handling
  let channel = null
  try {
    channel = await prisma.forumChannel.findUnique({
      where: { slug },
    })
  } catch (error) {
    console.error('Error fetching channel:', error)
    notFound()
  }

  if (!channel) {
    notFound()
  }

  // Fetch threads in this channel with error handling
  let threads: any[] = []
  try {
    threads = await prisma.forumThread.findMany({
      where: {
        channelId: channel.id,
      },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    })
  } catch (error: any) {
    // Handle missing metadata column (P2022) or other schema issues
    if (error?.code === 'P2022' || error?.message?.includes('metadata') || error?.message?.includes('does not exist')) {
      try {
        // Fallback: explicit select without problematic columns
        threads = await prisma.forumThread.findMany({
          where: {
            channelId: channel.id,
          },
          select: {
            id: true,
            title: true,
            content: true,
            isPinned: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                posts: true,
              },
            },
          },
          orderBy: [
            { isPinned: 'desc' },
            { updatedAt: 'desc' },
          ],
        })
      } catch (fallbackError) {
        console.error('Error fetching threads (fallback):', fallbackError)
      }
    } else {
      console.error('Error fetching threads:', error)
    }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">#{channel.name}</h1>
            <p className="text-sm text-gray-600">{channel.description}</p>
          </div>
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            <Link href={`/community/${slug}/new`}>Open a New Thread</Link>
          </Button>
        </div>
      </div>

      {threads.length > 0 ? (
        <div className="bg-white border border-gray-200">
          <div className="divide-y divide-gray-100">
            {threads.map((thread) => (
              <Link key={thread.id} href={`/community/${slug}/${thread.id}`}>
                <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {thread.isPinned && (
                          <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                            Pinned
                          </Badge>
                        )}
                        <h3 className="text-base font-medium text-gray-900">{thread.title}</h3>
                      </div>
                      {thread.content && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{thread.content}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>by {thread.author.username}</span>
                        <span>•</span>
                        <span>{thread._count.posts} {thread._count.posts === 1 ? 'reply' : 'replies'}</span>
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
          <p className="text-sm text-gray-500 mb-6">No threads yet. Be the first to start a discussion.</p>
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            <Link href={`/community/${slug}/new`}>Create First Thread</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

}
