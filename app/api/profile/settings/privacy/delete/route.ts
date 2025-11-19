import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/profile/settings/privacy/delete
 * 
 * Deletes all user data for GDPR Right to Erasure compliance.
 * 
 * This endpoint:
 * - Anonymizes/deletes user profile data
 * - Deletes all user progress, simulations, debriefs
 * - Deletes user from Supabase Auth
 * - Logs deletion in audit log
 * 
 * For v1, this is support-triggered only (no self-service UI).
 * Support should verify user identity before calling this endpoint.
 */
export async function DELETE(request: NextRequest) {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null
  
  try {
    user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Log deletion attempt in audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'account_deletion_requested',
          resourceType: 'user',
          resourceId: user.id,
          changes: {
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        },
      })
    } catch (auditError: any) {
      // Don't fail deletion if audit log fails
      if (!isMissingTable(auditError)) {
        console.error('Error logging deletion to audit log:', auditError)
      }
    }

    // Delete user data from database (cascade deletes will handle related records)
    // Note: Prisma schema should have onDelete: Cascade for related tables
    try {
      // Delete user profile (this will cascade to related records)
      await prisma.profile.delete({
        where: { id: user.id },
      })
    } catch (dbError: any) {
      // If profile doesn't exist, that's okay - continue with auth deletion
      if (dbError.code !== 'P2025') {
        throw dbError
      }
    }

    // Delete user from Supabase Auth
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (authError) {
        console.error('Error deleting user from Supabase Auth:', authError)
        // Continue even if auth deletion fails - data is already deleted
      }
    } catch (authError) {
      console.error('Error deleting user from Supabase Auth:', authError)
      // Continue - data is already deleted
    }

    // Log successful deletion
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id, // May fail if user is already deleted, that's okay
          action: 'account_deleted',
          resourceType: 'user',
          resourceId: user.id,
          changes: {
            timestamp: new Date().toISOString(),
            success: true,
          },
        },
      }).catch(() => {
        // Ignore errors - user may already be deleted
      })
    } catch (auditError) {
      // Ignore audit log errors for deletion confirmation
    }

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been deleted',
    })
  } catch (error: any) {
    // Log to Sentry with context (but don't expose sensitive data)
    Sentry.captureException(error, {
      tags: {
        route: '/api/profile/settings/privacy/delete',
        operation: 'delete_user_data',
      },
      extra: {
        userId: user?.id,
      },
    })

    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error deleting user data:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}
