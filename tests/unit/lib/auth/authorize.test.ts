import { requireAuth } from '@/lib/auth/authorize'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { createClient } from '@/lib/supabase/server'
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

describe('Auth Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any)

      const user = await getCurrentUser()

      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      })
      expect(createClient).toHaveBeenCalled()
    })

    it('should return null when not authenticated', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any)

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should return null on auth error', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Auth error' },
          }),
        },
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any)

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return user and role when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any)
      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'member',
      } as any)

      const result = await requireAuth()

      expect(result).toEqual({
        id: 'user-123',
        role: 'member',
      })
    })

    it('should throw error when not authenticated', async () => {
      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any)

      await expect(requireAuth()).rejects.toThrow('Unauthorized')
    })

    it('should throw error when profile not found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      const mockSupabaseClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }

      vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as any)
      vi.mocked(prisma.profile.findUnique).mockResolvedValue(null)

      await expect(requireAuth()).rejects.toThrow('Profile not found')
    })
  })
})
