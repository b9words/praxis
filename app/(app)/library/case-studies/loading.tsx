import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function CaseStudiesLoading() {
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
          <div className="p-4">
            <LoadingSkeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 p-6">
                  <LoadingSkeleton className="h-5 w-3/4 mb-4" />
                  <LoadingSkeleton className="h-4 w-full mb-2" />
                  <LoadingSkeleton className="h-4 w-5/6 mb-4" />
                  <div className="flex gap-2 mb-4">
                    <LoadingSkeleton className="h-5 w-16" />
                    <LoadingSkeleton className="h-5 w-16" />
                  </div>
                  <LoadingSkeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

