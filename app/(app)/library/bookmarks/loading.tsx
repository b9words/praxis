import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function BookmarksLoading() {
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
          <div className="p-4 space-y-4">
            <LoadingSkeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-neutral-50 border border-neutral-200 p-4">
                  <LoadingSkeleton className="h-5 w-3/4 mb-2" />
                  <LoadingSkeleton className="h-4 w-full mb-2" />
                  <LoadingSkeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

