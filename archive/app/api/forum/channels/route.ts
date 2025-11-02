import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Cache channels (15 minutes revalidate)
    const getCachedChannels = cache(
      async () => {
        const channels = await prisma.forumChannel.findMany({
          orderBy: {
            createdAt: 'asc',
          },
        })
        return channels
      },
      ['api', 'forum', 'channels'],
      {
        tags: [CacheTags.FORUM],
        revalidate: 900, // 15 minutes
      }
    )

    const channels = await getCachedChannels()

    return NextResponse.json({ channels })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching forum channels:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    // All auth checks removed

    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const channel = await prisma.forumChannel.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    })

    return NextResponse.json({ channel })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A channel with this slug already exists' }, { status: 400 })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error creating forum channel:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

