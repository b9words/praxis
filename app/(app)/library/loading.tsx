import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function LibraryLoading() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Desktop Header */}
      <div className="hidden md:block border-b border-neutral-200 bg-white flex-shrink-0">
        <div className="px-0 py-4">
          <LoadingSkeleton className="h-7 w-64 mb-1" />
          <LoadingSkeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-0 space-y-6 w-full">
          {/* Quick Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-neutral-200">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-neutral-50 border border-neutral-200 p-3">
                <div className="flex items-center gap-2">
                  <LoadingSkeleton className="h-4 w-4 rounded" />
                  <div className="flex-1">
                    <LoadingSkeleton className="h-6 w-12 mb-1" />
                    <LoadingSkeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Welcome Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-neutral-50 border border-neutral-200 p-3">
                <div className="flex items-start gap-3">
                  <LoadingSkeleton className="h-8 w-8 rounded" />
                  <div className="flex-1">
                    <LoadingSkeleton className="h-5 w-32 mb-1" />
                    <LoadingSkeleton className="h-4 w-full mb-3" />
                    <LoadingSkeleton className="h-8 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Continue Learning Section */}
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <LoadingSkeleton className="h-6 w-40" />
              <LoadingSkeleton className="h-6 w-20" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-neutral-50 border border-neutral-200">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <LoadingSkeleton className="h-3 w-8" />
                      <LoadingSkeleton className="h-3 w-16" />
                    </div>
                    <LoadingSkeleton className="h-5 w-full mb-2" />
                    <LoadingSkeleton className="h-4 w-full mb-3" />
                    <div className="mb-3">
                      <LoadingSkeleton className="h-1.5 w-full mb-1" />
                      <LoadingSkeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LoadingSkeleton className="h-4 w-4 rounded" />
                        <LoadingSkeleton className="h-3 w-20" />
                      </div>
                      <LoadingSkeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended for You */}
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <LoadingSkeleton className="h-6 w-40" />
              <LoadingSkeleton className="h-6 w-20" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-neutral-50 border border-neutral-200">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <LoadingSkeleton className="h-3 w-8" />
                      <LoadingSkeleton className="h-3 w-16" />
                    </div>
                    <LoadingSkeleton className="h-5 w-full mb-2" />
                    <LoadingSkeleton className="h-4 w-full mb-2" />
                    <LoadingSkeleton className="h-4 w-5/6 mb-4" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LoadingSkeleton className="h-4 w-4 rounded-full" />
                        <LoadingSkeleton className="h-3 w-20" />
                      </div>
                      <LoadingSkeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4 p-4">
            <LoadingSkeleton className="h-6 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-neutral-50 border border-neutral-200">
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LoadingSkeleton className="w-8 h-8 rounded" />
                        <div>
                          <LoadingSkeleton className="h-4 w-48 mb-1" />
                          <LoadingSkeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <LoadingSkeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
