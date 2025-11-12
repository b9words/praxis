import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AlertProps {
  className?: string
  children: ReactNode
  role?: string
  'aria-live'?: 'off' | 'assertive' | 'polite'
}

export function Alert({ className, children, role, 'aria-live': ariaLive }: AlertProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)} role={role} aria-live={ariaLive}>
      {children}
    </div>
  )
}

interface AlertTitleProps {
  className?: string
  children: ReactNode
}

export function AlertTitle({ className, children }: AlertTitleProps) {
  return (
    <h3 className={cn('mb-1 font-semibold leading-none tracking-tight', className)}>
      {children}
    </h3>
  )
}

interface AlertDescriptionProps {
  className?: string
  children: ReactNode
}

export function AlertDescription({ className, children }: AlertDescriptionProps) {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed', className)}>
      {children}
    </div>
  )
}

