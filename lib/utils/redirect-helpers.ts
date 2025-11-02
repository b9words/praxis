'use client'

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

/**
 * Safely redirects after a mutation by refreshing server-side data first
 * and then navigating to the destination. This prevents race conditions
 * where the server-side page render doesn't see updated data.
 * 
 * @param router - Next.js router instance
 * @param destination - Path to redirect to
 * @param queryParams - Optional query parameters to append (e.g., { onboarding: 'complete' })
 */
export async function safeRedirectAfterMutation(
  router: AppRouterInstance,
  destination: string,
  queryParams?: Record<string, string>
): Promise<void> {
  // Refresh server-side data before redirecting to ensure updated data is visible
  await router.refresh()
  
  // Build URL with query params if provided
  let finalDestination = destination
  if (queryParams && Object.keys(queryParams).length > 0) {
    // Simple approach: manually construct query string
    const queryString = new URLSearchParams(queryParams).toString()
    const separator = destination.includes('?') ? '&' : '?'
    finalDestination = `${destination}${separator}${queryString}`
  }
  
  // Use replace instead of push to avoid adding to history
  // This prevents back button issues after mutations
  router.replace(finalDestination)
}

