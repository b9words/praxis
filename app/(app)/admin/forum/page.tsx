import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'
import ForumManagement from '@/components/admin/ForumManagement'
import { cache, CacheTags } from '@/lib/cache'

export default async function AdminForumPage() {
  // Cache forum data queries (2 minutes revalidate)
  const getCachedForumData = cache(
    async () => {
      const [channels, threads, posts] = await Promise.all([
        prisma.forumChannel.findMany({
          include: {
            threads: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
        prisma.forumThread.findMany({
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
            channel: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            posts: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        }),
        prisma.forumPost.findMany({
          include: {
            author: {
              select: {
                id: true,
                username: true,
              },
            },
            thread: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        }),
      ])
      return { channels, threads, posts }
    },
    ['admin', 'forum', 'data'],
    {
      tags: [CacheTags.ADMIN, CacheTags.FORUM],
      revalidate: 120, // 2 minutes
    }
  )
  
  const { channels, threads, posts } = await getCachedForumData()

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <ForumManagement
        initialChannels={channels}
        initialThreads={threads}
        initialPosts={posts}
      />
    </div>
  )
}

