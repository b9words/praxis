import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

/**
 * Redirect route for /community/threads/[id] to /community/[slug]/[threadId]
 * This maintains backward compatibility with dashboard links
 */
export default async function ThreadRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    let thread: any = null
    try {
      thread = await (prisma as any).forumThread.findUnique({
        where: { id },
        include: {
          channel: {
            select: {
              slug: true,
            },
          },
        },
      })
    } catch (error: any) {
      if (!isMissingTable(error)) {
        console.error('Error fetching thread for redirect:', error)
      }
    }

    if (!thread) {
      notFound()
    }

    // All redirects removed - stay on current URL
  } catch (error) {
    console.error('Error fetching thread for redirect:', error)
    notFound()
  }
}

