import { requireRole } from '@/lib/auth/authorize'
import { revalidateCache, CacheTags } from '@/lib/cache'
import { updatePathWithItems, deleteLearningPath } from '@/lib/db/learningPaths'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

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

    try {
      const updated = await updatePathWithItems(id, {
        title,
        description,
        duration,
        status,
        items: items !== undefined ? items : undefined,
      })

      if (!updated) {
        return NextResponse.json({ error: 'Learning path not found' }, { status: 404 })
      }

      // Invalidate cache
      await revalidateCache(CacheTags.CURRICULUM)

      return NextResponse.json({
        path: {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          description: updated.description,
          duration: updated.duration,
          status: updated.status,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          items: updated.items.map(item => ({
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
      if (error.message?.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
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

    await deleteLearningPath(id)

    // Invalidate cache
    await revalidateCache(CacheTags.CURRICULUM)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error deleting learning path:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to delete learning path' }, { status: 500 })
  }
}

