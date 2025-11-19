'use client'

import { InlineBanner } from './inline-banner'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface CheckoutSuccessBannerProps {
  userId: string
  hasActiveSubscription: boolean
}

export function CheckoutSuccessBanner({ userId, hasActiveSubscription }: CheckoutSuccessBannerProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showBanner, setShowBanner] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const checkoutSuccess = searchParams.get('checkout') === 'success'

  useEffect(() => {
    if (checkoutSuccess && !hasActiveSubscription) {
      setShowBanner(true)
      // Auto-refresh subscription status after a delay
      const checkInterval = setInterval(async () => {
        if (!isChecking) {
          setIsChecking(true)
          try {
            const response = await fetch('/api/auth/user')
            if (response.ok) {
              const data = await response.json()
              // If subscription is now active, refresh the page
              if (data.subscription?.status === 'active') {
                router.refresh()
                clearInterval(checkInterval)
              }
            }
          } catch (error) {
            console.error('Error checking subscription:', error)
          } finally {
            setIsChecking(false)
          }
        }
      }, 5000) // Check every 5 seconds

      // Stop checking after 2 minutes
      const timeout = setTimeout(() => {
        clearInterval(checkInterval)
      }, 120000)

      return () => {
        clearInterval(checkInterval)
        clearTimeout(timeout)
      }
    } else if (hasActiveSubscription && checkoutSuccess) {
      // If subscription is active, remove the query param
      const params = new URLSearchParams(searchParams.toString())
      params.delete('checkout')
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
      router.replace(newUrl)
    }
  }, [checkoutSuccess, hasActiveSubscription, router, isChecking, searchParams])

  if (!checkoutSuccess || hasActiveSubscription || !showBanner) {
    return null
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Remove checkout=success from URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('checkout')
    router.replace(`${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div className="mb-6">
      <InlineBanner
        variant="success"
        title="Payment Successful"
        message="Your subscription should activate within a minute. Once active, you'll have full access to your plan's content. If you don't see your subscription active after a few minutes, please contact support@execemy.com and we'll help you right away."
        dismissible={true}
        onDismiss={handleDismiss}
      />
    </div>
  )
}

