import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function ProfileEditLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-48 mb-2" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* Profile form skeleton */}
      <div className="bg-white border border-gray-200 p-8 max-w-2xl">
        <div className="space-y-6">
          {/* Avatar skeleton */}
          <div className="flex items-center gap-4">
            <LoadingSkeleton variant="circular" className="w-20 h-20" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Form fields */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="h-10 w-full" />
            </div>
          ))}

          {/* Save button */}
          <LoadingSkeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}

