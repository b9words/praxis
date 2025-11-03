import { prisma } from '@/lib/prisma/server'
import { cache, CacheTags } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Cache channels (15 minutes revalidate)
    const getCachedChannels = cache(
      async () => {
        let channels: any[] = []
        try {
          channels = await (prisma as any).forumChannel?.findMany({
            orderBy: {
              createdAt: 'asc',
            },
          }) || []
        } catch (error: any) {
          // Forum tables might not exist
          channels = []
        }
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

    let channel: any = null
    try {
      channel = await (prisma as any).forumChannel.create({
        data: {
          name,
          slug,
          description: description || null,
        },
      })
    } catch (error: any) {
      return NextResponse.json({ error: 'Forum channels are not available' }, { status: 503 })
    }

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

