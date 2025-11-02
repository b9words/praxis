import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function DashboardLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="space-y-8">
        {/* Personalized Header */}
        <div className="text-center space-y-4">
          <LoadingSkeleton className="h-10 w-96 mx-auto" />
          <div className="flex items-center justify-center gap-3">
            <LoadingSkeleton className="h-8 w-32" />
            <LoadingSkeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Learning Phase Indicator Card */}
        <div className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <LoadingSkeleton className="h-6 w-48" />
            <LoadingSkeleton className="h-6 w-24" />
          </div>
          
          {/* Learning Flow Visualization - 4 phases */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <LoadingSkeleton className="w-12 h-12 rounded-full mb-2" />
                <LoadingSkeleton className="h-4 w-16 mb-1" />
                <LoadingSkeleton className="h-3 w-20" />
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <LoadingSkeleton className="h-4 w-32" />
              <LoadingSkeleton className="h-4 w-24" />
            </div>
            <LoadingSkeleton className="h-2 w-full" />
          </div>
        </div>

        {/* Content Shelf - Your Next Optimal Move */}
        <div className="mb-12">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <LoadingSkeleton className="h-6 w-64 mb-2" />
              <LoadingSkeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="flex gap-3 -mx-6 px-6 pb-3 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} className="flex-shrink-0 w-[180px] h-[240px] rounded-lg" />
            ))}
          </div>
        </div>

        {/* Content Shelf - Jump Back In */}
        <div className="mb-12">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <LoadingSkeleton className="h-6 w-48 mb-2" />
              <LoadingSkeleton className="h-4 w-72" />
            </div>
          </div>
          <div className="flex gap-3 -mx-6 px-6 pb-3 overflow-x-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} className="flex-shrink-0 w-[180px] h-[200px] rounded-lg" />
            ))}
          </div>
        </div>

        {/* Content Shelf - Strengthen Your Core */}
        <div className="mb-12">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <LoadingSkeleton className="h-6 w-56 mb-2" />
              <LoadingSkeleton className="h-4 w-80" />
            </div>
          </div>
          <div className="flex gap-3 -mx-6 px-6 pb-3 overflow-x-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} className="flex-shrink-0 w-[180px] h-[220px] rounded-lg" />
            ))}
          </div>
        </div>

        {/* Quick Stats - 3 cards */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <LoadingSkeleton className="h-8 w-16 mx-auto mb-2" />
              <LoadingSkeleton className="h-4 w-32 mx-auto" />
            </div>
          ))}
        </div>

        {/* Execemy Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="mb-4">
              <LoadingSkeleton className="h-5 w-48 mb-2" />
              <LoadingSkeleton className="h-4 w-64" />
            </div>
            <LoadingSkeleton className="h-64 w-full rounded" />
            <div className="mt-4 text-center">
              <LoadingSkeleton className="h-4 w-64 mx-auto mb-2" />
              <LoadingSkeleton className="h-9 w-32 mx-auto" />
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <LoadingSkeleton className="h-5 w-40" />
          </div>
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <LoadingSkeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <LoadingSkeleton className="h-4 w-48 mb-2" />
                  <LoadingSkeleton className="h-3 w-24" />
                </div>
                <LoadingSkeleton className="w-4 h-4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
