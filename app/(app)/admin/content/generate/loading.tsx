import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function AdminGenerateLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-64 mb-2" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* Form skeleton */}
      <div className="bg-white border border-gray-200 p-8 max-w-2xl">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-10 w-full" />
            </div>
          ))}
          <LoadingSkeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}

