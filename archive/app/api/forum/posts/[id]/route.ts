import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let post: any = null
    try {
      post = await prisma.forumPost.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          thread: {
            select: {
              id: true,
              title: true,
              channel: {
                select: {
                  slug: true,
                },
              },
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
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      })
    } catch (error: any) {
      // Handle missing columns (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
          post = await prisma.forumPost.findUnique({
            where: { id },
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
              thread: {
                select: {
                  id: true,
                  title: true,
                  channel: {
                    select: {
                      slug: true,
                    },
                  },
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
              replies: {
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
              },
            },
          })
        } catch (fallbackError) {
          console.error('Error fetching post (fallback):', fallbackError)
        }
      } else {
        throw error
      }
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function PUT(
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

    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user owns the post
    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let updatedPost: any = null
    try {
      updatedPost = await prisma.forumPost.update({
        where: { id },
        data: { content },
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
          updatedPost = await prisma.forumPost.update({
            where: { id },
            data: { content },
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

    return NextResponse.json({ post: updatedPost })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating post:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function DELETE(
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

    // Check if user owns the post or is admin
    const post = await prisma.forumPost.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    // Only author or admin can delete
    if (post.authorId !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.forumPost.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

