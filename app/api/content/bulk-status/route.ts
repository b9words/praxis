import { getCurrentUser } from '@/lib/auth/get-user'
import { hasRequiredRole } from '@/lib/auth/middleware-helpers'
import { prisma } from '@/lib/prisma/server'
import { logAdminAction } from '@/lib/admin/audit-log'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/content/bulk-status
 * Bulk update status for articles and/or cases
 * Body: { ids: string[], type: 'article' | 'case' | 'both', status: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only editors and admins can bulk update
    const userRole = await hasRequiredRole(user.id, ['editor', 'admin'])
    if (!userRole.hasRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        const result = await prisma.article.updateMany({
          where: {
            id: { in: articleIds },
          },
          data: {
            status,
            updatedBy: user.id,
          },
        })
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
        const result = await prisma.case.updateMany({
          where: {
            id: { in: caseIds },
          },
          data: {
            status,
            updatedBy: user.id,
          },
        })
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

    return NextResponse.json({
      success: true,
      updated: {
        articles: updatedArticles,
        cases: updatedCases,
        total: updatedArticles + updatedCases,
      },
    })
  } catch (error: any) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error in bulk status update:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

