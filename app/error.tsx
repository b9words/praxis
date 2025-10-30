'use client'

import { Button } from '@/components/ui/button'
import { captureException } from '@/lib/monitoring'
import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console and capture in Sentry
    console.error('Application error:', error)
    captureException(error, {
      digest: error.digest,
      componentStack: error.stack,
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="flex justify-center">
          <div className="max-w-md w-full text-center">
            <div className="bg-white border border-neutral-200 p-8">
              <AlertTriangle className="h-16 w-16 text-neutral-700 mx-auto mb-4" />
              <h1 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
                System Error
              </h1>
              <p className="text-neutral-600 mb-6">
                An unexpected error occurred. Attempt recovery or contact support if the issue persists.
              </p>
              {error.message && (
                <div className="bg-neutral-50 border border-neutral-200 p-3 mb-6 text-left rounded-none">
                  <p className="text-sm text-neutral-700 font-mono">{error.message}</p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={reset} className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none">Retry</Button>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="border-neutral-300 hover:border-neutral-400 rounded-none">
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

