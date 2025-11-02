import ReplyForm from '@/components/community/ReplyForm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
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

  // Cache thread lookup (2 minutes revalidate)
  const getCachedThread = cache(
    async () => {
      let thread: any = null
      try {
        thread = await prisma.forumThread.findUnique({
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
      } catch (error: any) {
        // Handle missing metadata column (P2022) or other schema issues
        if (error?.code === 'P2022' || error?.message?.includes('metadata') || error?.message?.includes('does not exist')) {
          try {
            // Fallback: explicit select without problematic columns
            thread = await prisma.forumThread.findUnique({
              where: { id: threadId },
              select: {
                id: true,
                title: true,
                content: true,
                isPinned: true,
                createdAt: true,
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
          } catch (fallbackError) {
            console.error('Error fetching thread (fallback):', fallbackError)
          }
        } else {
          console.error('Error fetching thread:', error)
        }
      }
      return thread
    },
    ['forum', 'thread', threadId],
    {
      tags: [CacheTags.FORUM, CacheTags.COMMUNITY, `thread-${threadId}`],
      revalidate: 120, // 2 minutes
    }
  )

  // Cache posts in this thread (1 minute revalidate - frequently updated)
  const getCachedPosts = cache(
    async () => {
      let posts: any[] = []
      try {
        posts = await prisma.forumPost.findMany({
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
      } catch (error: any) {
        // Handle missing columns (P2022) or other schema issues
        if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
          try {
            // Fallback: explicit select without problematic columns
            posts = await prisma.forumPost.findMany({
              where: {
                threadId,
                parentPostId: null,
              },
              select: {
                id: true,
                threadId: true,
                authorId: true,
                content: true,
                parentPostId: true,
                createdAt: true,
                updatedAt: true,
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
          } catch (fallbackError) {
            console.error('Error fetching posts (fallback):', fallbackError)
            posts = [] // Continue with empty posts array
          }
        } else {
          console.error('Error fetching posts:', error)
          posts = [] // Continue with empty posts array
        }
      }
      return posts
    },
    ['forum', 'posts', 'thread', threadId],
    {
      tags: [CacheTags.FORUM, CacheTags.COMMUNITY, `thread-${threadId}`],
      revalidate: 60, // 1 minute (frequently updated)
    }
  )

  const [thread, posts] = await Promise.all([
    getCachedThread(),
    getCachedPosts(),
  ])

  if (!thread) {
    notFound()
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-6">
        <Link href="/community" className="hover:text-gray-900 transition-colors">
          The Exchange
        </Link>
        {' / '}
        <Link href={`/community/${slug}`} className="hover:text-gray-900 transition-colors">
          #{thread.channel.name}
        </Link>
      </div>

      {/* Thread */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarImage src={thread.author.avatarUrl || undefined} />
              <AvatarFallback className="text-xs bg-gray-100 text-gray-700">
                {thread.author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {thread.isPinned && (
                  <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                    Pinned
                  </Badge>
                )}
                <h1 className="text-2xl font-medium text-gray-900">{thread.title}</h1>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                by{' '}
                <Link
                  href={`/profile/${thread.author.username}`}
                  className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {thread.author.username}
                </Link>
                {' • '}
                {new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="prose max-w-none">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{thread.content}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts/Replies */}
      <div className="mb-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
          </h2>
        </div>

        {posts.length > 0 && (
          <div className="bg-white border border-gray-200">
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <div key={post.id} className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border border-gray-200">
                      <AvatarImage src={post.author.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-gray-100 text-gray-700">
                        {post.author.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">
                        <Link
                          href={`/profile/${post.author.username}`}
                          className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          {post.author.username}
                        </Link>
                        {' • '}
                        {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reply Form */}
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Post a Reply</h2>
        </div>
        <div className="p-6">
          <ReplyForm threadId={threadId} />
        </div>
      </div>
    </div>
  )
}
