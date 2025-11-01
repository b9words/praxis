import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function CaseBriefLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-3/4 mb-2" />
        <LoadingSkeleton className="h-4 w-48" />
      </div>

      {/* Briefing document skeleton */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <LoadingSkeleton className="h-6 w-40" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-4">
        <LoadingSkeleton className="h-10 w-48" />
        <LoadingSkeleton className="h-10 w-48" />
      </div>
    </div>
  )
}

