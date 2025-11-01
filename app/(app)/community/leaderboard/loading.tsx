import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-48 mb-2" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* Leaderboard table skeleton */}
      <div className="bg-white border border-gray-200">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <LoadingSkeleton className="h-6 w-8" />
              <LoadingSkeleton variant="circular" className="w-10 h-10" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-32" />
                <LoadingSkeleton className="h-3 w-24" />
              </div>
              <LoadingSkeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

