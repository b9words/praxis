'use client'

import ErrorState from '@/components/ui/error-state'
import { captureException } from '@/lib/monitoring'
import { useEffect } from 'react'

export default function SimulationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Simulations error:', error)
    captureException(error, {
      digest: error.digest,
      componentStack: error.stack,
      context: 'simulations',
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Simulations Error"
          message="Unable to load simulations. Please try again."
          error={error}
          onRetry={reset}
          showBackToDashboard={true}
        />
      </div>
    </div>
  )
}

