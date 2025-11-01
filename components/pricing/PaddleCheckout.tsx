'use client'

import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

interface PaddleCheckoutProps {
  planId: string
  planName: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  className?: string
  children?: React.ReactNode
}

declare global {
  interface Window {
    Paddle?: {
      Setup: (config: { vendor: number; environment?: string }) => void
      Checkout: {
        open: (config: {
          product?: number
          items?: Array<{ priceId: string; quantity: number }>
          email?: string
          customerId?: string
          passthrough?: string
          successUrl?: string
          settings?: {
            displayMode?: string
            theme?: string
          }
        }) => void
      }
      Spinner: {
        show: () => void
        hide: () => void
      }
    }
  }
}

export default function PaddleCheckout({
  planId,
  planName,
  onSuccess,
  onError,
  className,
  children,
}: PaddleCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const paddleInitialized = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || paddleInitialized.current) return

    const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID
    if (!vendorId) {
      console.error('NEXT_PUBLIC_PADDLE_VENDOR_ID not configured')
      return
    }

    // Load Paddle.js script
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.async = true
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Setup({
          vendor: parseInt(vendorId),
          environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox',
        })
        paddleInitialized.current = true
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Fetch user info if logged in
  const { data: userData } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: ({ signal }) => fetchJson('/api/auth/user', { signal }).catch(() => null),
    retry: false,
  })

  const handleCheckout = async () => {
    if (!window.Paddle || !paddleInitialized.current) {
      onError?.(new Error('Paddle not initialized'))
      return
    }

    setIsLoading(true)
    try {
      const userEmail = userData?.email
      const customerId = userData?.id

      window.Paddle.Checkout.open({
        items: [{ priceId: planId, quantity: 1 }],
        email: userEmail,
        customerId: customerId,
        passthrough: JSON.stringify({
          planName,
          userId: customerId,
        }),
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
        },
      })

      // Listen for checkout completion
      window.addEventListener('paddle:checkout:completed', () => {
        setIsLoading(false)
        onSuccess?.()
      })

      window.addEventListener('paddle:checkout:error', (event: any) => {
        setIsLoading(false)
        onError?.(new Error(event.detail?.message || 'Checkout error'))
      })
    } catch (error) {
      setIsLoading(false)
      onError?.(error instanceof Error ? error : new Error('Failed to open checkout'))
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading || !paddleInitialized.current}
      className={className}
    >
      {isLoading ? 'Loading...' : children || 'Get Started'}
    </Button>
  )
}

