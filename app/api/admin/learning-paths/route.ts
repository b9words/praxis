import { requireRole } from '@/lib/auth/authorize'
import { revalidateCache, CacheTags } from '@/lib/cache'
import { listLearningPaths, createLearningPath } from '@/lib/db/learningPaths'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const runtime = 'nodejs'

/**
 * GET /api/admin/learning-paths
 * List all learning paths (including drafts for admins/editors)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(['editor', 'admin'])

    const paths = await listLearningPaths()

    return NextResponse.json({
      paths: paths.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        duration: p.duration,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        items: p.items.map(item => ({
          id: item.id,
          order: item.order,
          type: item.type,
          domain: item.domain,
          module: item.module,
          lesson: item.lesson,
          caseId: item.caseId,
        })),
      })),
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error fetching learning paths:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to fetch learning paths' }, { status: 500 })
  }
}

/**
 * POST /api/admin/learning-paths
 * Create a new learning path
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['editor', 'admin'])

    const body = await request.json()
    const { title, description, duration, status = 'draft', items = [] } = body

    // Validation
    if (!title || !duration) {
      return NextResponse.json(
        { error: 'Title and duration are required' },
        { status: 400 }
      )
    }

    try {
      const path = await createLearningPath({
        title,
        description: description || null,
        duration,
        status: status || 'draft',
        items: items || [],
      })

      // Invalidate cache
      await revalidateCache(CacheTags.CURRICULUM)

      return NextResponse.json({
        path: {
          id: path.id,
          slug: path.slug,
          title: path.title,
          description: path.description,
          duration: path.duration,
          status: path.status,
          createdAt: path.createdAt,
          updatedAt: path.updatedAt,
          items: path.items.map(item => ({
            id: item.id,
            order: item.order,
            type: item.type,
            domain: item.domain,
            module: item.module,
            lesson: item.lesson,
            caseId: item.caseId,
          })),
        },
      }, { status: 201 })
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
    console.error('Error creating learning path:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Failed to create learning path' }, { status: 500 })
  }
}

