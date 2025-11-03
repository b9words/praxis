'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { analytics } from '@/lib/analytics'

/**
 * Client component to track PostHog pageviews on route changes
 * Must be used in a client component or as a child of server component
 * This component subscribes to Next.js router changes and sends pageviews manually
 * to avoid duplicate events (PostHog auto-capture is disabled)
 */
export default function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Build full path with query params
    const query = searchParams?.toString()
    const pagePath = query ? `${pathname}?${query}` : pathname

    // Send pageview to PostHog
    // analytics.page() checks if PostHog is loaded, so this is safe to call
    analytics.page(pagePath)
  }, [pathname, searchParams])

  return null // This component doesn't render anything
}

