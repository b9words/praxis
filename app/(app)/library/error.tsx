'use client'

import ErrorState from '@/components/ui/error-state'
import { captureException } from '@/lib/monitoring'
import { useEffect } from 'react'

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Library error:', error)
    captureException(error, {
      digest: error.digest,
      componentStack: error.stack,
      context: 'library',
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Library Error"
          message="Unable to load library content. Please try again."
          error={error}
          onRetry={reset}
          showBackToDashboard={true}
        />
      </div>
    </div>
  )
}

