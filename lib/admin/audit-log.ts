/**
 * Audit logging utility for admin actions
 */

import { prisma } from '@/lib/prisma/server'
import { safeCreate, safeFindMany } from '@/lib/prisma-safe'

export interface AuditLogEntry {
  userId: string
  action: 'create' | 'update' | 'delete' | 'status_change' | 'role_change'
  resourceType: string
  resourceId: string
  changes?: Record<string, any>
  reason?: string
}

export async function logAdminAction(entry: AuditLogEntry) {
  const result = await safeCreate(
    'auditLog',
    {
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      changes: entry.changes || {},
      reason: entry.reason,
    }
  )
  
  if (result.error) {
    // Log to console as fallback if database insert fails
    console.error('[AUDIT] Failed to log admin action:', result.error)
    console.log('[AUDIT]', {
      timestamp: new Date().toISOString(),
      ...entry,
    })
  }
}

export async function getAuditLogs(filters?: {
  userId?: string
  resourceType?: string
  action?: string
  limit?: number
}) {
  const where: any = {}
  
  if (filters?.userId) {
    where.userId = filters.userId
  }
  if (filters?.resourceType) {
    where.resourceType = filters.resourceType
  }
  if (filters?.action) {
    where.action = filters.action
  }

  const result = await safeFindMany(
    'auditLog',
    where,
    {
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
    }
  )

  if (result.error) {
    console.error('Failed to fetch audit logs:', result.error)
  }

  return result.data || []
}

