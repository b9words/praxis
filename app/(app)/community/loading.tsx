import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function CommunityLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-48 mb-2" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* Channels skeleton */}
      <div className="mb-12">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <LoadingSkeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 p-6">
              <LoadingSkeleton className="h-5 w-24 mb-2" />
              <LoadingSkeleton className="h-4 w-full mb-4" />
              <LoadingSkeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Threads skeleton */}
      <div>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <LoadingSkeleton className="h-6 w-40" />
        </div>
        <div className="bg-white border border-gray-200">
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <LoadingSkeleton className="h-5 w-3/4 mb-2" />
                <LoadingSkeleton className="h-4 w-full mb-2" />
                <LoadingSkeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

