import { getCurrentUser } from '@/lib/auth/get-user'
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

    let posts: any[] = []
    try {
      posts = await prisma.forumPost.findMany({
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
    } catch (error: any) {
      // Handle missing columns (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
          posts = await prisma.forumPost.findMany({
            where: { threadId: id },
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
        } catch (fallbackError) {
          console.error('Error fetching posts (fallback):', fallbackError)
        }
      } else {
        throw error
      }
    }

    return NextResponse.json({ posts })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
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

    let post: any = null
    try {
      post = await prisma.forumPost.create({
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
    } catch (error: any) {
      // Handle missing columns (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
          post = await prisma.forumPost.create({
            data: {
              threadId: id,
              authorId: user.id,
              content,
              parentPostId: parentPostId || null,
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
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          })
        } catch (fallbackError) {
          throw fallbackError
        }
      } else {
        throw error
      }
    }

    // Update thread's updated_at
    await prisma.forumThread.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error creating post:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

