import { cn } from '@/lib/utils'

interface ContainerProps {
  variant?: 'app' | 'marketing' | 'full'
  className?: string
  children: React.ReactNode
}

export default function Container({ variant = 'app', className, children }: ContainerProps) {
  if (variant === 'full') {
    return <div className={cn('w-full h-full', className)}>{children}</div>
  }

  const baseClasses = 'max-w-screen-2xl mx-auto px-6 lg:px-8'
  const paddingClasses = variant === 'marketing' ? 'py-16' : 'py-12'

  return (
    <div className={cn(baseClasses, paddingClasses, className)}>
      {children}
    </div>
  )
}


