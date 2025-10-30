import { requireRole } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/prisma/server', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock get-user to avoid dependency
vi.mock('@/lib/auth/get-user', () => ({
  getCurrentUser: vi.fn(),
}))

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Role Hierarchy', () => {
    it('should allow admin to access editor routes', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        email: 'admin@example.com',
      })

      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'admin',
      } as any)

      const result = await requireRole('editor')

      expect(result).toEqual({
        id: 'user-123',
        role: 'admin',
      })
    })

    it('should allow admin to access admin routes', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        email: 'admin@example.com',
      })

      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'admin',
      } as any)

      const result = await requireRole('admin')

      expect(result).toEqual({
        id: 'user-123',
        role: 'admin',
      })
    })

    it('should allow editor to access editor routes', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        email: 'editor@example.com',
      })

      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'editor',
      } as any)

      const result = await requireRole('editor')

      expect(result).toEqual({
        id: 'user-123',
        role: 'editor',
      })
    })

    it('should deny member from accessing editor routes', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        email: 'member@example.com',
      })

      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'member',
      } as any)

      await expect(requireRole('editor')).rejects.toThrow('Forbidden')
    })

    it('should deny member from accessing admin routes', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        email: 'member@example.com',
      })

      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'member',
      } as any)

      await expect(requireRole('admin')).rejects.toThrow('Forbidden')
    })

    it('should support array of required roles', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        email: 'editor@example.com',
      })

      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'editor',
      } as any)

      const result = await requireRole(['editor', 'admin'])

      expect(result).toEqual({
        id: 'user-123',
        role: 'editor',
      })
    })

    it('should throw error when not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      await expect(requireRole('member')).rejects.toThrow('Unauthorized')
    })

    it('should throw error when profile not found', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      })

      vi.mocked(prisma.profile.findUnique).mockResolvedValue(null)

      await expect(requireRole('member')).rejects.toThrow('Profile not found')
    })
  })
})

