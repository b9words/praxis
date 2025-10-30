import { sendApplicationStatusEmail, sendSubscriptionConfirmationEmail, sendWelcomeEmail } from '@/lib/email'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Resend
const mockResendEmailsCreate = vi.fn()

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      create: mockResendEmailsCreate,
    },
  })),
}))

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-api-key'
    process.env.RESEND_FROM_EMAIL = 'noreply@test.com'
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      mockResendEmailsCreate.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await sendWelcomeEmail('test@example.com', 'John Doe')

      expect(mockResendEmailsCreate).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'test@example.com',
        subject: expect.stringContaining('Welcome'),
        html: expect.stringContaining('John Doe'),
      })
    })

    it('should use username if fullName not provided', async () => {
      mockResendEmailsCreate.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await sendWelcomeEmail('test@example.com', undefined, 'johndoe')

      expect(mockResendEmailsCreate).toHaveBeenCalled()
      const callArgs = mockResendEmailsCreate.mock.calls[0][0]
      expect(callArgs.html).toContain('johndoe')
    })

    it('should throw error if email sending fails', async () => {
      mockResendEmailsCreate.mockResolvedValue({
        data: null,
        error: { message: 'Email failed' },
      })

      await expect(sendWelcomeEmail('test@example.com', 'John')).rejects.toThrow()
    })
  })

  describe('sendApplicationStatusEmail', () => {
    it('should send approval email with correct content', async () => {
      mockResendEmailsCreate.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await sendApplicationStatusEmail('test@example.com', 'John Doe', 'approved')

      expect(mockResendEmailsCreate).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'test@example.com',
        subject: expect.stringContaining('Approved'),
        html: expect.stringContaining('John Doe'),
      })
    })

    it('should send rejection email with correct content', async () => {
      mockResendEmailsCreate.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await sendApplicationStatusEmail('test@example.com', 'John Doe', 'rejected')

      expect(mockResendEmailsCreate).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'test@example.com',
        subject: expect.stringContaining('Application'),
        html: expect.stringContaining('John Doe'),
      })
    })
  })

  describe('sendSubscriptionConfirmationEmail', () => {
    it('should send subscription confirmation email', async () => {
      mockResendEmailsCreate.mockResolvedValue({ data: { id: 'email-123' }, error: null })

      await sendSubscriptionConfirmationEmail('test@example.com', 'John Doe', 'Premium Plan', '100')

      expect(mockResendEmailsCreate).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'test@example.com',
        subject: expect.stringContaining('Subscription'),
        html: expect.stringContaining('Premium Plan'),
      })
    })
  })
})

