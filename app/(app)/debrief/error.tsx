'use client'

import ErrorState from '@/components/ui/error-state'
import { captureException } from '@/lib/monitoring'
import { useEffect } from 'react'

export default function DebriefError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Debrief error:', error)
    captureException(error, {
      digest: error.digest,
      componentStack: error.stack,
      context: 'debrief',
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Debrief Error"
          message="Unable to load debrief. The simulation may not be completed yet or the debrief data is unavailable."
          error={error}
          onRetry={reset}
          showBackToDashboard={true}
        />
      </div>
    </div>
  )
}

