import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const channels = await prisma.forumChannel.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })

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

