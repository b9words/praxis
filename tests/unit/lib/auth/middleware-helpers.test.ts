import { getUserRole, hasRequiredRole } from '@/lib/auth/middleware-helpers'
import { createClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

describe('Middleware Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  describe('getUserRole', () => {
    it('should return user role from database', async () => {
      const mockSupabaseClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as any)

      const role = await getUserRole('user-123')

      expect(role).toBe('admin')
      expect(createClient).toHaveBeenCalled()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('should return null when user not found', async () => {
      const mockSupabaseClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as any)

      const role = await getUserRole('user-123')

      expect(role).toBeNull()
    })

    it('should return null on error', async () => {
      const mockSupabaseClient = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Database error')),
      }

      vi.mocked(createClient).mockReturnValue(mockSupabaseClient as any)

      const role = await getUserRole('user-123')

      expect(role).toBeNull()
    })
  })

  describe('hasRequiredRole', () => {
    it('should return true when user has higher role', () => {
      expect(hasRequiredRole('admin', ['editor'])).toBe(true)
      expect(hasRequiredRole('admin', ['member'])).toBe(true)
      expect(hasRequiredRole('editor', ['member'])).toBe(true)
    })

    it('should return true when user has exact role', () => {
      expect(hasRequiredRole('admin', ['admin'])).toBe(true)
      expect(hasRequiredRole('editor', ['editor'])).toBe(true)
      expect(hasRequiredRole('member', ['member'])).toBe(true)
    })

    it('should return false when user has lower role', () => {
      expect(hasRequiredRole('member', ['editor'])).toBe(false)
      expect(hasRequiredRole('member', ['admin'])).toBe(false)
      expect(hasRequiredRole('editor', ['admin'])).toBe(false)
    })

    it('should return true if user role matches any in array', () => {
      expect(hasRequiredRole('admin', ['editor', 'admin'])).toBe(true)
      expect(hasRequiredRole('member', ['member', 'editor'])).toBe(true)
    })

    it('should return false if user role does not match any in array', () => {
      expect(hasRequiredRole('member', ['editor', 'admin'])).toBe(false)
    })
  })
})

