import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ErrorStateProps {
  title?: string
  message?: string
  error?: Error | string | null
  onRetry?: () => void
  retryLabel?: string
  showBackToDashboard?: boolean
  className?: string
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  error,
  onRetry,
  retryLabel = 'Try again',
  showBackToDashboard = true,
  className = '',
}: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message

  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="max-w-lg w-full text-center">
        <div className="bg-white border border-neutral-200 p-8">
          <AlertTriangle className="h-12 w-12 text-neutral-700 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-neutral-900 mb-2">{title}</h2>
          <p className="text-sm text-neutral-600 mb-4">{message}</p>
          {errorMessage && (
            <div className="bg-neutral-50 border border-neutral-200 p-3 mb-6 text-left rounded-none">
              <p className="text-xs text-neutral-700 font-mono break-all">{errorMessage}</p>
            </div>
          )}
          <div className="space-y-3">
            <div className="flex gap-3 justify-center">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {retryLabel}
                </Button>
              )}
              {showBackToDashboard && (
                <Button
                  variant="outline"
                  asChild
                  className="border-neutral-300 hover:border-neutral-400 rounded-none"
                >
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
              )}
            </div>
            <p className="text-xs text-neutral-500 text-center">
              Still having issues? Contact{' '}
              <a href="mailto:support@execemy.com" className="underline hover:text-neutral-700">
                support@execemy.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

