/**
 * Audit logging utility for admin actions
 */

import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'

export interface AuditLogEntry {
  userId: string
  action: 'create' | 'update' | 'delete' | 'status_change' | 'role_change'
  resourceType: string
  resourceId: string
  changes?: Record<string, any>
  reason?: string
}

export async function logAdminAction(entry: AuditLogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        changes: entry.changes || {},
        reason: entry.reason,
      },
    })
  } catch (error: any) {
    // Log to console as fallback if database insert fails
    if (!isMissingTable(error)) {
      console.error('[AUDIT] Failed to log admin action:', error)
    }
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

  try {
    const logs = await prisma.auditLog.findMany({
      where,
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
    })
    return logs
  } catch (error: any) {
    if (isMissingTable(error)) {
      return []
    }
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

