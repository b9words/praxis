'use client'

import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/api'
import { useState } from 'react'

interface MockCheckoutProps {
  planId?: string
  planName: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  className?: string
  children?: React.ReactNode
}

export default function MockCheckout({
  planName,
  onSuccess,
  onError,
  className,
  children,
}: MockCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const response = await fetchJson('/api/mock/subscribe', {
        method: 'POST',
        body: { planName },
      })

      if (response.success) {
        onSuccess?.()
        
        // Check for returnUrl in query params
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl')
        
        if (returnUrl) {
          // Redirect to the original content
          window.location.href = returnUrl
        } else {
          // Default to dashboard
          window.location.href = '/dashboard'
        }
      } else {
        throw new Error('Subscription failed')
      }
    } catch (error) {
      setIsLoading(false)
      onError?.(error instanceof Error ? error : new Error('Failed to subscribe'))
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Subscribing...' : children || 'Get Started'}
    </Button>
  )
}

