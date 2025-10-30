import { GET, PATCH, POST } from '@/app/api/applications/route'
import * as authorizeModule from '@/lib/auth/authorize'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the auth and prisma modules
vi.mock('@/lib/auth/authorize')
vi.mock('@/lib/prisma/server', () => ({
  prisma: {
    userApplication: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock('@/lib/email')
vi.mock('@/lib/notifications/triggers')

describe('Applications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/applications', () => {
    it('should create a new application', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      vi.spyOn(authorizeModule, 'requireAuth').mockResolvedValue(mockUser as any)

      const { prisma } = await import('@/lib/prisma/server')
      vi.mocked(prisma.userApplication.create).mockResolvedValue({
        id: 'app-1',
        email: 'test@example.com',
        fullName: 'Test User',
        motivation: 'Test motivation',
        background: 'Test background',
        status: 'pending',
        userId: 'user-1',
        reviewedBy: null,
        reviewedAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const request = new NextRequest('http://localhost/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          fullName: 'Test User',
          motivation: 'Test motivation',
          background: 'Test background',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.application).toBeDefined()
      expect(data.application.email).toBe('test@example.com')
    })

    it('should require authentication', async () => {
      vi.spyOn(authorizeModule, 'requireAuth').mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          motivation: 'Test',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/applications', () => {
    it('should require admin role', async () => {
      vi.spyOn(authorizeModule, 'requireRole').mockRejectedValue(new Error('Forbidden'))

      const request = new NextRequest('http://localhost/api/applications')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should return applications for admin', async () => {
      const mockUser = { id: 'admin-1' }
      vi.spyOn(authorizeModule, 'requireRole').mockResolvedValue(undefined)
      vi.spyOn(authorizeModule, 'getCurrentUser').mockResolvedValue(mockUser as any)

      const { prisma } = await import('@/lib/prisma/server')
      vi.mocked(prisma.userApplication.findMany).mockResolvedValue([
        {
          id: 'app-1',
          email: 'test@example.com',
          status: 'pending',
        },
      ] as any)

      const request = new NextRequest('http://localhost/api/applications')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.applications)).toBe(true)
    })
  })

  describe('PATCH /api/applications', () => {
    it('should update application status and send notifications', async () => {
      vi.spyOn(authorizeModule, 'requireRole').mockResolvedValue(undefined)

      const { prisma } = await import('@/lib/prisma/server')
      vi.mocked(prisma.userApplication.findUnique).mockResolvedValue({
        id: 'app-1',
        email: 'test@example.com',
        status: 'pending',
        userId: 'user-1',
      } as any)

      vi.mocked(prisma.userApplication.update).mockResolvedValue({
        id: 'app-1',
        status: 'approved',
      } as any)

      const request = new NextRequest('http://localhost/api/applications', {
        method: 'PATCH',
        body: JSON.stringify({
          applicationId: 'app-1',
          status: 'approved',
        }),
      })

      const response = await PATCH(request)
      expect(response.status).toBe(200)

      // Verify email was sent (mocked)
      const { sendApplicationStatusEmail } = await import('@/lib/email')
      expect(vi.mocked(sendApplicationStatusEmail)).toHaveBeenCalled()
    })
  })
})

