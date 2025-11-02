import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function ThreadLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {/* Header skeleton */}
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-3/4 mb-2" />
        <div className="flex items-center gap-4 mt-4">
          <LoadingSkeleton variant="circular" className="w-10 h-10" />
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Thread content skeleton */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <LoadingSkeleton className="h-4 w-full mb-2" />
        <LoadingSkeleton className="h-4 w-full mb-2" />
        <LoadingSkeleton className="h-4 w-full mb-2" />
        <LoadingSkeleton className="h-4 w-3/4" />
      </div>

      {/* Replies skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <LoadingSkeleton variant="circular" className="w-10 h-10" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

