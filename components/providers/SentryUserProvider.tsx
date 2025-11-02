'use client'

import { setUser } from '@/lib/monitoring'
import { useEffect } from 'react'

interface SentryUserProviderProps {
  userId?: string | null
  email?: string | null
  username?: string | null
}

/**
 * Sets Sentry user context when user is authenticated
 * Should be placed in app layout to ensure user context is set for all authenticated requests
 */
export default function SentryUserProvider({ userId, email, username }: SentryUserProviderProps) {
  useEffect(() => {
    if (userId) {
      setUser({
        id: userId,
        email: email || undefined,
        username: username || undefined,
      })
    }
  }, [userId, email, username])

  return null
}

