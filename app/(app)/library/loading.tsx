import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function LibraryLoading() {
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
          {/* Header section skeleton */}
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <LoadingSkeleton className="h-8 w-48" />
              <LoadingSkeleton className="h-4 w-96" />
            </div>
            <LoadingState type="article-grid" count={6} />
          </div>
        </div>
      </div>
    </div>
  )
}
