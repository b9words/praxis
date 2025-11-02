import { getCurrentUser } from '@/lib/auth/get-user'
import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { revalidateCache, CacheTags } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

/**
 * PUT /api/admin/learning-paths/[id]
 * Update a learning path
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['editor', 'admin'])

    const { id } = await params
    const body = await request.json()
    const { title, description, duration, status, items } = body

    // Find existing path
    const existing = await prisma.learningPath.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      )
    }

    // Update slug if title changed
    let slug = existing.slug
    if (title && title !== existing.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100)

      // Check if new slug conflicts
      const conflict = await prisma.learningPath.findUnique({
        where: { slug },
      })

      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: 'A learning path with this title already exists' },
          { status: 400 }
        )
      }
    }

    // Update path and items in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update path
      const path = await tx.learningPath.update({
        where: { id },
        data: {
          ...(slug && { slug }),
          ...(title && { title }),
          ...(description !== undefined && { description: description || null }),
          ...(duration && { duration }),
          ...(status && { status }),
        },
      })

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Delete all existing items
        await tx.learningPathItem.deleteMany({
          where: { pathId: id },
        })

        // Create new items
        await tx.learningPathItem.createMany({
          data: items.map((item: any, index: number) => ({
            pathId: id,
            order: index,
            type: item.type,
            domain: item.domain || null,
            module: item.module || null,
            lesson: item.lesson || null,
            caseId: item.caseId || null,
          })),
        })
      }

      // Fetch updated path with items
      return await tx.learningPath.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      })
    })

    // Invalidate cache
    await revalidateCache(CacheTags.CURRICULUM)

    return NextResponse.json({
      path: {
        id: updated!.id,
        slug: updated!.slug,
        title: updated!.title,
        description: updated!.description,
        duration: updated!.duration,
        status: updated!.status,
        createdAt: updated!.createdAt,
        updatedAt: updated!.updatedAt,
        items: updated!.items.map(item => ({
          id: item.id,
          order: item.order,
          type: item.type,
          domain: item.domain,
          module: item.module,
          lesson: item.lesson,
          caseId: item.caseId,
        })),
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    
    console.error('Error updating learning path:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to update learning path' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/learning-paths/[id]
 * Delete a learning path
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['editor', 'admin'])

    const { id } = await params

    const existing = await prisma.learningPath.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      )
    }

    await prisma.learningPath.delete({
      where: { id },
    })

    // Invalidate cache
    await revalidateCache(CacheTags.CURRICULUM)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    
    console.error('Error deleting learning path:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to delete learning path' }, { status: 500 })
  }
}

