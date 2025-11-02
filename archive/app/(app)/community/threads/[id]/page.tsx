import { prisma } from '@/lib/prisma/server'
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
    const thread = await prisma.forumThread.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            slug: true,
          },
        },
      },
    })

    if (!thread) {
      notFound()
    }

    // All redirects removed - stay on current URL
  } catch (error) {
    console.error('Error fetching thread for redirect:', error)
    notFound()
  }
}

