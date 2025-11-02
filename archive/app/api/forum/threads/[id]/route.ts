import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let thread: any = null
    try {
      thread = await prisma.forumThread.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
      })
    } catch (error: any) {
      // Handle missing metadata column (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('metadata') || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
          thread = await prisma.forumThread.findUnique({
            where: { id },
            select: {
              id: true,
              channelId: true,
              authorId: true,
              title: true,
              content: true,
              isPinned: true,
              createdAt: true,
              updatedAt: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
              channel: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              _count: {
                select: {
                  posts: true,
                },
              },
            },
          })
        } catch (fallbackError) {
          console.error('Error fetching thread (fallback):', fallbackError)
        }
      } else {
        throw error
      }
    }

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    return NextResponse.json({ thread })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error fetching thread:', error)
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

    const { title, content, isPinned } = body

    // Check if user owns the thread or is admin/editor
    const thread = await prisma.forumThread.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Only author or admin/editor can update
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (thread.authorId !== user.id && profile?.role !== 'admin' && profile?.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let updatedThread: any = null
    try {
      updatedThread = await prisma.forumThread.update({
        where: { id },
        data: {
          title,
          content,
          isPinned: profile?.role === 'admin' || profile?.role === 'editor' ? isPinned : undefined,
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
      // Handle missing metadata column (P2022) or other schema issues
      if (error?.code === 'P2022' || error?.message?.includes('metadata') || error?.message?.includes('does not exist')) {
        try {
          // Fallback: explicit select without problematic columns
          updatedThread = await prisma.forumThread.update({
            where: { id },
            data: {
              title,
              content,
              isPinned: profile?.role === 'admin' || profile?.role === 'editor' ? isPinned : undefined,
            },
            select: {
              id: true,
              channelId: true,
              authorId: true,
              title: true,
              content: true,
              isPinned: true,
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

    return NextResponse.json({ thread: updatedThread })
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
    console.error('Error updating thread:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function PATCH(
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

    // Check if user is admin/editor
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (profile?.role !== 'admin' && profile?.role !== 'editor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const thread = await prisma.forumThread.findUnique({
      where: { id },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    let updatedThread: any = null
    try {
      updatedThread = await prisma.forumThread.update({
        where: { id },
        data: body, // Allow partial updates
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
      if (error?.code === 'P2022' || error?.message?.includes('metadata')) {
        updatedThread = await prisma.forumThread.update({
          where: { id },
          data: body,
          select: {
            id: true,
            channelId: true,
            authorId: true,
            title: true,
            content: true,
            isPinned: true,
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
      } else {
        throw error
      }
    }

    return NextResponse.json({ thread: updatedThread })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating thread:', error)
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

    // Check if user owns the thread or is admin
    const thread = await prisma.forumThread.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    // Only author or admin can delete
    if (thread.authorId !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.forumThread.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
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
    console.error('Error deleting thread:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

