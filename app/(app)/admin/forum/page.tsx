import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { redirect } from 'next/navigation'
import ForumManagement from '@/components/admin/ForumManagement'
import { cache, CacheTags } from '@/lib/cache'

export default async function AdminForumPage() {
  // Cache forum data queries (2 minutes revalidate)
  const getCachedForumData = cache(
    async () => {
      let channels: any[] = []
      let threads: any[] = []
      let posts: any[] = []
      
      try {
        [channels, threads, posts] = await Promise.all([
          (prisma as any).forumChannel.findMany({
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
          (prisma as any).forumThread.findMany({
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
          (prisma as any).forumPost.findMany({
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
      } catch (error: any) {
        if (!isMissingTable(error)) {
          console.error('Error fetching forum data:', error)
        }
      }
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

