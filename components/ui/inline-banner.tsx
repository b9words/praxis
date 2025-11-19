'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export type InlineBannerVariant = 'success' | 'error' | 'warning' | 'info'

interface InlineBannerProps {
  variant?: InlineBannerVariant
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  autoDismiss?: number // milliseconds
  action?: {
    label: string
    onClick: () => void
  }
}

const variantStyles = {
  success: {
    container: 'border-green-200 bg-green-50',
    icon: 'text-green-600',
    title: 'text-green-900',
    message: 'text-green-800',
    iconComponent: CheckCircle2,
  },
  error: {
    container: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-800',
    iconComponent: AlertCircle,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    message: 'text-amber-800',
    iconComponent: AlertTriangle,
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-800',
    iconComponent: Info,
  },
}

export function InlineBanner({
  variant = 'info',
  title,
  message,
  dismissible = true,
  onDismiss,
  className,
  autoDismiss,
  action,
}: InlineBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const styles = variantStyles[variant]
  const Icon = styles.iconComponent

  useEffect(() => {
    if (autoDismiss && autoDismiss > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, onDismiss])

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <Alert
      className={cn(
        styles.container,
        'relative',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {title && (
            <AlertTitle className={styles.title}>{title}</AlertTitle>
          )}
          <AlertDescription className={styles.message}>
            {message}
          </AlertDescription>
          {action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className={cn(
                  variant === 'success' && 'border-green-300 text-green-700 hover:bg-green-100',
                  variant === 'error' && 'border-red-300 text-red-700 hover:bg-red-100',
                  variant === 'warning' && 'border-amber-300 text-amber-700 hover:bg-amber-100',
                  variant === 'info' && 'border-blue-300 text-blue-700 hover:bg-blue-100',
                )}
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={cn(
              'h-6 w-6 p-0 flex-shrink-0',
              styles.icon,
              'hover:bg-transparent'
            )}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}


