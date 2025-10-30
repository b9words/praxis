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
  } catch (error) {
    console.error('Error fetching forum channels:', error)
    return NextResponse.json({ error: 'Failed to fetch forum channels' }, { status: 500 })
  }
}

