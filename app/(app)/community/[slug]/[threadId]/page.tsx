import ReplyForm from '@/components/community/ReplyForm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { slug, threadId } = await params

  // Fetch thread with author
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
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
  })

  if (!thread) {
    notFound()
  }

  // Fetch posts in this thread (root posts only)
  const posts = await prisma.forumPost.findMany({
    where: {
      threadId,
      parentPostId: null,
    },
    include: {
      author: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <Link href="/community" className="hover:text-gray-900">
          The Exchange
        </Link>
        {' / '}
        <Link href={`/community/${slug}`} className="hover:text-gray-900">
          #{thread.channel.name}
        </Link>
      </div>

      {/* Thread */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={thread.author.avatarUrl || undefined} />
              <AvatarFallback>{thread.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {thread.isPinned && <Badge variant="secondary">Pinned</Badge>}
                <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                by{' '}
                <Link
                  href={`/profile/${thread.author.username}`}
                  className="font-medium hover:text-gray-900"
                >
                  {thread.author.username}
                </Link>
                {' • '}
                {new Date(thread.createdAt).toLocaleDateString()}
              </p>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{thread.content}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts/Replies */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatarUrl || undefined} />
                      <AvatarFallback>
                        {post.author.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        <Link
                          href={`/profile/${post.author.username}`}
                          className="font-medium hover:text-gray-900"
                        >
                          {post.author.username}
                        </Link>
                        {' • '}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Form */}
        <Card>
          <CardContent className="pt-6">
            <ReplyForm threadId={threadId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
