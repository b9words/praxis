'use client'

import ErrorState from '@/components/ui/error-state'
import { captureException } from '@/lib/monitoring'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
    captureException(error, {
      digest: error.digest,
      componentStack: error.stack,
      context: 'dashboard',
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Dashboard Error"
          message="Unable to load dashboard content. Please try again."
          error={error}
          onRetry={reset}
          showBackToDashboard={false}
        />
      </div>
    </div>
  )
}

