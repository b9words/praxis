'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export type ProgressStep = {
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

interface ProgressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  steps?: ProgressStep[]
  currentStep?: number
  progress?: number // 0-100
  status?: 'processing' | 'success' | 'error'
  errorMessage?: string
  onCancel?: () => void
  cancellable?: boolean
}

export function ProgressModal({
  open,
  onOpenChange,
  title,
  description,
  steps,
  currentStep,
  progress,
  status = 'processing',
  errorMessage,
  onCancel,
  cancellable = true,
}: ProgressModalProps) {
  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const getStatusIcon = () => {
    if (status === 'success') {
      return <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
    }
    if (status === 'error') {
      return <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
    }
    return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" aria-hidden="true" />
  }

  const getStatusText = () => {
    if (status === 'success') return 'Completed'
    if (status === 'error') return 'Failed'
    return 'Processing...'
  }

  return (
    <Dialog open={open} onOpenChange={cancellable ? onOpenChange : undefined}>
      <DialogContent
        aria-labelledby="progress-title"
        aria-describedby="progress-description"
        className="sm:max-w-md"
        showCloseButton={cancellable}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon()}
            <DialogTitle id="progress-title">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription id="progress-description" className="pt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {steps && steps.length > 0 ? (
            <div className="space-y-3">
              {steps.map((step, index) => {
                const isActive = step.status === 'active' || (currentStep !== undefined && index === currentStep)
                const isCompleted = step.status === 'completed' || (currentStep !== undefined && index < currentStep)
                const isError = step.status === 'error'

                return (
                  <div
                    key={index}
                    className={`
                      flex items-center gap-3 text-sm
                      ${isActive ? 'text-gray-900 font-medium' : ''}
                      ${isCompleted ? 'text-gray-600' : ''}
                      ${step.status === 'pending' ? 'text-gray-400' : ''}
                      ${isError ? 'text-red-600' : ''}
                    `}
                  >
                    {isCompleted && !isError ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : isError ? (
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span>{step.label}</span>
                  </div>
                )
              })}
            </div>
          ) : progress !== undefined ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{getStatusText()}</span>
                {progress !== undefined && <span>{Math.round(progress)}%</span>}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="text-sm text-gray-600 text-center py-2">
              {getStatusText()}
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}
        </div>

        {cancellable && status === 'processing' && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-none"
            >
              Cancel
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="flex justify-end">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-none"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

