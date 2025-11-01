'use client'

import ErrorState from '@/components/ui/error-state'
import { captureException } from '@/lib/monitoring'
import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
    captureException(error, {
      digest: error.digest,
      componentStack: error.stack,
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorState
        title="Something went wrong"
        message="An error occurred while loading this page."
        error={error}
        onRetry={reset}
        showBackToDashboard={true}
        className="min-h-screen"
      />
    </div>
  )
}

