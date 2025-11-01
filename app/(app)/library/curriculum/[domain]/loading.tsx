import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function DomainLoading() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Desktop Header */}
      <div className="hidden md:block border-b border-neutral-200 bg-white flex-shrink-0">
        <div className="px-0 py-4">
          <LoadingSkeleton className="h-7 w-64 mb-1" />
          <LoadingSkeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-0 space-y-6 w-full">
          {/* Breadcrumbs skeleton */}
          <div className="p-4 border-b border-neutral-200">
            <LoadingSkeleton className="h-4 w-48" />
          </div>

          {/* Domain header skeleton */}
          <div className="p-4 space-y-4">
            <LoadingSkeleton className="h-8 w-3/4" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-5/6" />
          </div>

          {/* Modules skeleton */}
          <div className="p-4 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-neutral-50 border border-neutral-200 p-4">
                <LoadingSkeleton className="h-6 w-48 mb-4" />
                <div className="space-y-2 ml-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <LoadingSkeleton key={j} className="h-4 w-full max-w-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

