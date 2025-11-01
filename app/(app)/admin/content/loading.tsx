import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function AdminContentLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <LoadingSkeleton className="h-8 w-48 mb-2" />
          <LoadingSkeleton className="h-4 w-96" />
        </div>
        <LoadingSkeleton className="h-10 w-32" />
      </div>

      {/* Content list skeleton */}
      <div className="bg-white border border-gray-200">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <LoadingSkeleton className="h-5 w-3/4" />
                  <LoadingSkeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <LoadingSkeleton className="h-5 w-16" />
                    <LoadingSkeleton className="h-5 w-16" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <LoadingSkeleton className="h-9 w-20" />
                  <LoadingSkeleton className="h-9 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

