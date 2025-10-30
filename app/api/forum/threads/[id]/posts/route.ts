import { requireAuth } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const thread = await prisma.forumThread.findUnique({
      where: { id },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const posts = await prisma.forumPost.findMany({
      where: { threadId: id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        parentPost: {
          select: {
            id: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const { content, parentPostId } = body

    if (!content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const thread = await prisma.forumThread.findUnique({
      where: { id },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const post = await prisma.forumPost.create({
      data: {
        threadId: id,
        authorId: user.id,
        content,
        parentPostId: parentPostId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Update thread's updated_at
    await prisma.forumThread.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

