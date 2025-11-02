import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function OnboardingLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-64 mb-2" />
        <LoadingSkeleton className="h-4 w-96 mb-4" />
        <div className="flex items-center gap-4">
          <LoadingSkeleton className="h-2 flex-1 max-w-xs" />
          <LoadingSkeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Residency Selection Card */}
      <div className="bg-white border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <LoadingSkeleton className="h-5 w-64 mb-1" />
          <LoadingSkeleton className="h-3 w-96" />
        </div>
        <div className="p-6 space-y-6">
          {/* Recommended Path Card */}
          <div className="border border-gray-300 bg-gray-50 relative">
            <LoadingSkeleton className="absolute -top-3 left-4 h-5 w-24" />
            <div className="p-6 pt-8">
              <div className="flex items-start gap-4">
                <LoadingSkeleton className="w-12 h-12 rounded" />
                <div className="flex-1">
                  <LoadingSkeleton className="h-5 w-64 mb-2" />
                  <LoadingSkeleton className="h-4 w-full mb-4" />
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <LoadingSkeleton key={i} className="h-3 w-full" />
                    ))}
                  </div>
                  <LoadingSkeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Alternative Paths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 p-6 opacity-60">
                <div className="text-center">
                  <LoadingSkeleton className="h-4 w-24 mx-auto mb-2" />
                  <LoadingSkeleton className="h-3 w-full mb-4" />
                  <LoadingSkeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Flow Cards */}
      <div className="bg-white border border-gray-200 mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <LoadingSkeleton className="h-5 w-48 mb-1" />
          <LoadingSkeleton className="h-3 w-80" />
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 p-6 text-center">
                <LoadingSkeleton className="w-16 h-16 rounded mx-auto mb-4" />
                <LoadingSkeleton className="h-4 w-20 mx-auto mb-2" />
                <LoadingSkeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
          
          {/* Execemy Profile Section */}
          <div className="bg-gray-50 border border-gray-200 p-6">
            <LoadingSkeleton className="h-5 w-48 mx-auto mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <LoadingSkeleton className="h-4 w-full mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <LoadingSkeleton key={i} className="h-3 w-40" />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <LoadingSkeleton className="w-32 h-32 rounded mx-auto mb-4" />
                <LoadingSkeleton className="h-3 w-48 mx-auto" />
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <LoadingSkeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    </div>
  )
}

