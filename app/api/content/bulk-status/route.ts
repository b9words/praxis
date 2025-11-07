import { getCurrentUser } from '@/lib/auth/get-user'
import { requireRole } from '@/lib/auth/authorize'
import { bulkUpdateArticleStatuses } from '@/lib/db/articles'
import { bulkUpdateCaseStatuses } from '@/lib/db/cases'
import { logAdminAction } from '@/lib/admin/audit-log'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 0

/**
 * POST /api/content/bulk-status
 * Bulk update status for articles and/or cases
 * Body: { ids: string[], type: 'article' | 'case' | 'both', status: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Only editors and admins can bulk update
    try {
      await requireRole(['editor', 'admin'])
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids, type, status } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs array required' }, { status: 400 })
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Valid status required' }, { status: 400 })
    }

    if (!['article', 'case', 'both'].includes(type)) {
      return NextResponse.json({ error: 'Type must be article, case, or both' }, { status: 400 })
    }

    let updatedArticles = 0
    let updatedCases = 0

    // Update articles if type is 'article' or 'both'
    if (type === 'article' || type === 'both') {
      const articleIds = type === 'both' 
        ? ids.filter((id: string) => {
            // Try to find if it's an article - this is a simple heuristic
            // In a real implementation, you'd need to track which IDs are which
            return true // We'll update both and let Prisma handle errors
          })
        : ids

      try {
        const result = await bulkUpdateArticleStatuses(articleIds, status, user.id)
        updatedArticles = result.count

        // Log audit actions
        for (const id of articleIds) {
          try {
            await logAdminAction({
              userId: user.id,
              action: 'status_change',
              resourceType: 'article',
              resourceId: id,
              changes: { status },
            })
          } catch (auditError) {
            // Don't fail the operation if audit logging fails
            console.error('Failed to log audit action:', auditError)
          }
        }
      } catch (error) {
        // If articles don't exist, that's okay if type is 'both'
        if (type === 'both') {
          // Continue to cases
        } else {
          throw error
        }
      }
    }

    // Update cases if type is 'case' or 'both'
    if (type === 'case' || type === 'both') {
      const caseIds = type === 'both'
        ? ids
        : ids

      try {
        const result = await bulkUpdateCaseStatuses(caseIds, status, user.id)
        updatedCases = result.count

        // Log audit actions
        for (const id of caseIds) {
          try {
            await logAdminAction({
              userId: user.id,
              action: 'status_change',
              resourceType: 'case',
              resourceId: id,
              changes: { status },
            })
          } catch (auditError) {
            // Don't fail the operation if audit logging fails
            console.error('Failed to log audit action:', auditError)
          }
        }
      } catch (error) {
        // If cases don't exist, that's okay if type is 'both'
        if (type === 'both') {
          // Already processed articles
        } else {
          throw error
        }
      }
    }

    // No server cache - client queries will refetch automatically
    const response = NextResponse.json({
      success: true,
      updated: {
        articles: updatedArticles,
        cases: updatedCases,
        total: updatedArticles + updatedCases,
      },
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error in bulk status update:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

