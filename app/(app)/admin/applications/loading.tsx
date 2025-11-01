import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function AdminApplicationsLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-48 mb-2" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* Applications table skeleton */}
      <div className="bg-white border border-gray-200">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <LoadingSkeleton variant="circular" className="w-10 h-10" />
                  <div className="space-y-2 flex-1">
                    <LoadingSkeleton className="h-4 w-48" />
                    <LoadingSkeleton className="h-3 w-32" />
                  </div>
                </div>
                <LoadingSkeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

