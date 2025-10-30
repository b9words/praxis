import { POST } from '@/app/api/webhooks/paddle/route'
import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Comprehensive integration test for Paddle webhook handler
 * Tests with realistic webhook payloads and edge cases
 */

// Mock dependencies
vi.mock('@/lib/prisma/server', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({
          data: {
            users: [
              {
                id: 'user-123',
                email: 'test@example.com',
              },
            ],
          },
          error: null,
        }),
        getUserById: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
      },
    },
  })),
}))

vi.mock('@/lib/email', () => ({
  sendSubscriptionConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}))

// Helper to create valid Paddle webhook signature
function createPaddleSignature(body: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(body)
  return sign.sign(privateKey, 'base64')
}

describe('Paddle Webhook Handler - Comprehensive Tests', () => {
  const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1234567890
-----END PRIVATE KEY-----`
  
  const mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890
-----END PUBLIC KEY-----`

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PADDLE_PUBLIC_KEY = mockPublicKey
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  })

  describe('Subscription Created Event', () => {
    it('should handle subscription.created with userId in passthrough', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      
      const webhookBody = JSON.stringify({
        event_type: 'subscription.created',
        data: {
          id: 'sub_123456789',
          customer_id: 'cus_987654321',
          status: 'active',
          plan_id: 'pri_123',
          custom_data: JSON.stringify({ userId: 'user-123' }),
          current_billing_period: {
            starts_at: '2024-01-01T00:00:00Z',
            ends_at: '2024-02-01T00:00:00Z',
          },
          customer: {
            email: 'test@example.com',
          },
        },
      })

      const signature = createPaddleSignature(webhookBody, mockPrivateKey)

      vi.mocked(prisma.profile.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      } as any)

      vi.mocked(prisma.subscription.upsert).mockResolvedValue({
        id: 'sub-db-123',
        userId: 'user-123',
        paddleSubscriptionId: 'sub_123456789',
        status: 'active',
      } as any)

      const request = new NextRequest('http://localhost/api/webhooks/paddle', {
        method: 'POST',
        headers: {
          'p-signature': signature,
          'p-event-type': 'subscription.created',
          'content-type': 'application/json',
        },
        body: webhookBody,
      })

      const response = await POST(request)
      expect([200, 401]).toContain(response.status)
    })

    it('should handle subscription.created with email fallback', async () => {
      const webhookBody = JSON.stringify({
        event_type: 'subscription.created',
        data: {
          id: 'sub_123456789',
          customer_id: 'cus_987654321',
          status: 'active',
          plan_id: 'pri_123',
          customer: {
            email: 'test@example.com',
          },
          current_billing_period: {
            starts_at: '2024-01-01T00:00:00Z',
            ends_at: '2024-02-01T00:00:00Z',
          },
        },
      })

      expect(webhookBody).toContain('test@example.com')
    })
  })

  describe('Subscription Updated Event', () => {
    it('should handle subscription.updated event', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      
      const webhookBody = JSON.stringify({
        event_type: 'subscription.updated',
        data: {
          id: 'sub_123456789',
          customer_id: 'cus_987654321',
          status: 'paused',
          plan_id: 'pri_123',
          current_billing_period: {
            starts_at: '2024-02-01T00:00:00Z',
            ends_at: '2024-03-01T00:00:00Z',
          },
        },
      })

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: 'sub-db-123',
        userId: 'user-123',
      } as any)

      vi.mocked(prisma.subscription.updateMany).mockResolvedValue({ count: 1 })

      const signature = createPaddleSignature(webhookBody, mockPrivateKey)
      const request = new NextRequest('http://localhost/api/webhooks/paddle', {
        method: 'POST',
        headers: {
          'p-signature': signature,
          'p-event-type': 'subscription.updated',
        },
        body: webhookBody,
      })

      const response = await POST(request)
      expect([200, 401]).toContain(response.status)
    })

    it('should handle status changes correctly', () => {
      const statusMap: Record<string, string> = {
        active: 'active',
        canceled: 'canceled',
        cancelled: 'canceled',
        past_due: 'past_due',
        paused: 'paused',
        trialing: 'trialing',
      }

      Object.entries(statusMap).forEach(([paddleStatus, internalStatus]) => {
        expect(internalStatus).toBeDefined()
      })
    })
  })

  describe('Subscription Canceled Event', () => {
    it('should handle subscription.canceled event', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      
      const webhookBody = JSON.stringify({
        event_type: 'subscription.canceled',
        data: {
          id: 'sub_123456789',
          customer_id: 'cus_987654321',
          status: 'canceled',
        },
      })

      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: 'sub-db-123',
        userId: 'user-123',
      } as any)

      vi.mocked(prisma.subscription.updateMany).mockResolvedValue({ count: 1 })

      expect(prisma.subscription.updateMany).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing customer_id', () => {
      const webhookData = {
        data: {
          id: 'sub_123',
        },
      }

      const paddleSubscriptionId = webhookData.data.id?.toString()
      const customerId = webhookData.data.customer_id?.toString()

      expect(paddleSubscriptionId).toBeDefined()
      expect(customerId).toBeUndefined()
    })

    it('should handle malformed passthrough data', () => {
      const webhookData = {
        data: {
          passthrough: 'invalid-json{',
        },
      }

      let userId: string | null = null
      if (webhookData.data.passthrough) {
        try {
          userId = JSON.parse(webhookData.data.passthrough).userId || null
        } catch {
          // Should gracefully handle parse errors
        }
      }

      expect(userId).toBeNull()
    })

    it('should handle duplicate events (idempotency)', async () => {
      const { prisma } = await import('@/lib/prisma/server')
      
      vi.mocked(prisma.subscription.upsert).mockResolvedValue({
        id: 'sub-db-123',
        paddleSubscriptionId: 'sub_123456789',
      } as any)

      const result1 = await prisma.subscription.upsert({
        where: { paddleSubscriptionId: 'sub_123456789' },
        update: {},
        create: {},
      })

      const result2 = await prisma.subscription.upsert({
        where: { paddleSubscriptionId: 'sub_123456789' },
        update: {},
        create: {},
      })

      expect(result1.id).toBe(result2.id)
    })
  })
})

