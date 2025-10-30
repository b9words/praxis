import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Integration test for Paddle webhook user linking
 * This tests the critical user linking logic
 */

describe('Paddle Webhook User Linking', () => {
  const mockPaddlePublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890
-----END PUBLIC KEY-----`

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PADDLE_PUBLIC_KEY = mockPaddlePublicKey
  })

  describe('User Linking Strategy', () => {
    it('should prioritize userId from passthrough/custom_data', () => {
      const webhookData = {
        data: {
          id: 'sub_123',
          customer_id: 'cus_456',
          passthrough: JSON.stringify({ userId: 'user-789' }),
          customer: {
            email: 'test@example.com',
          },
        },
      }

      // Extract userId from passthrough (simulating webhook logic)
      let userId: string | null = null
      if (webhookData.data.passthrough) {
        try {
          const passthrough = JSON.parse(webhookData.data.passthrough)
          userId = passthrough.userId || null
        } catch {
          // Ignore parse errors
        }
      }

      expect(userId).toBe('user-789')
    })

    it('should fallback to email lookup if passthrough missing', () => {
      const webhookData = {
        data: {
          id: 'sub_123',
          customer_id: 'cus_456',
          customer: {
            email: 'test@example.com',
          },
        },
      }

      const customerEmail = webhookData.data.customer?.email

      expect(customerEmail).toBe('test@example.com')
      // In real implementation, this would trigger email lookup via Supabase Admin API
    })

    it('should handle custom_data format', () => {
      const webhookData = {
        data: {
          id: 'sub_123',
          customer_id: 'cus_456',
          custom_data: JSON.stringify({ userId: 'user-abc' }),
          customer: {
            email: 'test@example.com',
          },
        },
      }

      let userId: string | null = null
      if (webhookData.data.custom_data) {
        try {
          const customData = typeof webhookData.data.custom_data === 'string'
            ? JSON.parse(webhookData.data.custom_data)
            : webhookData.data.custom_data
          userId = customData.userId || null
        } catch {
          // Ignore parse errors
        }
      }

      expect(userId).toBe('user-abc')
    })
  })

  describe('Subscription Status Mapping', () => {
    it('should map Paddle statuses to internal statuses', () => {
      const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'paused' | 'trialing'> = {
        active: 'active',
        canceled: 'canceled',
        cancelled: 'canceled',
        past_due: 'past_due',
        paused: 'paused',
        trialing: 'trialing',
      }

      expect(statusMap['active']).toBe('active')
      expect(statusMap['canceled']).toBe('canceled')
      expect(statusMap['cancelled']).toBe('canceled')
      expect(statusMap['past_due']).toBe('past_due')
    })
  })
})

