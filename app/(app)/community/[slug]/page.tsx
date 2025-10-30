import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

  // Fetch channel
  const channel = await prisma.forumChannel.findUnique({
    where: { slug },
  })

  if (!channel) {
    notFound()
  }

  // Fetch threads in this channel
  const threads = await prisma.forumThread.findMany({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">#{channel.name}</h1>
          <p className="mt-2 text-gray-600">{channel.description}</p>
        </div>
        <Button asChild>
          <Link href={`/community/${slug}/new`}>New Thread</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <Link key={thread.id} href={`/community/${slug}/${thread.id}`}>
              <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {thread.isPinned && <Badge variant="secondary">Pinned</Badge>}
                        <h3 className="font-semibold text-gray-900">{thread.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{thread.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                        <span>by {thread.author.username}</span>
                        <span>•</span>
                        <span>{thread._count.posts} replies</span>
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
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>No threads yet. Be the first to start a discussion!</p>
              <Button asChild className="mt-4">
                <Link href={`/community/${slug}/new`}>Create First Thread</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
