import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  lines?: number
  height?: string
  width?: string
}

export default function LoadingSkeleton({ 
  className, 
  variant = 'rectangular',
  lines = 1,
  height,
  width 
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'
  
  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={cn(
              baseClasses,
              'h-4',
              index === lines - 1 ? 'w-3/4' : 'w-full',
              className
            )}
            style={{ height, width }}
          />
        ))}
      </div>
    )
  }
  
  if (variant === 'circular') {
    return (
      <div 
        className={cn(baseClasses, 'rounded-full w-10 h-10', className)}
        style={{ height, width }}
      />
    )
  }
  
  if (variant === 'card') {
    return (
      <div className={cn('p-6 border rounded-lg space-y-4', className)}>
        <div className="flex items-center space-x-4">
          <LoadingSkeleton variant="circular" />
          <div className="space-y-2 flex-1">
            <LoadingSkeleton variant="text" lines={1} />
            <LoadingSkeleton variant="text" lines={1} className="w-2/3" />
          </div>
        </div>
        <LoadingSkeleton variant="text" lines={3} />
      </div>
    )
  }
  
  return (
    <div 
      className={cn(baseClasses, 'h-4 w-full', className)}
      style={{ height, width }}
    />
  )
}

interface LoadingStateProps {
  type: 'dashboard' | 'article-grid' | 'simulation' | 'profile'
  count?: number
}

export function LoadingState({ type, count = 3 }: LoadingStateProps) {
  switch (type) {
    case 'dashboard':
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <LoadingSkeleton className="h-8 w-64" />
            <LoadingSkeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="card" className="h-24" />
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="card" className="h-64" />
            <LoadingSkeleton variant="card" className="h-64" />
          </div>
        </div>
      )
      
    case 'article-grid':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" className="h-48" />
          ))}
        </div>
      )
      
    case 'simulation':
      return (
        <div className="space-y-6">
          <LoadingSkeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="card" className="h-96" />
            <LoadingSkeleton variant="card" className="h-96" />
          </div>
        </div>
      )
      
    case 'profile':
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <LoadingSkeleton variant="circular" className="w-20 h-20" />
            <div className="space-y-2 flex-1">
              <LoadingSkeleton className="h-6 w-48" />
              <LoadingSkeleton className="h-4 w-32" />
            </div>
          </div>
          <LoadingSkeleton variant="card" className="h-64" />
        </div>
      )
      
    default:
      return <LoadingSkeleton variant="card" />
  }
}
