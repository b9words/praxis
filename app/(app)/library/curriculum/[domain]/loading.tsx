import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function DomainLoading() {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4 md:px-6 md:py-6 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <LoadingSkeleton className="h-4 w-4" />
            <LoadingSkeleton className="h-3 w-24" />
            <LoadingSkeleton className="h-4 w-4" />
            <LoadingSkeleton className="h-3 w-32" />
          </div>

          {/* Header */}
          <div className="space-y-6">
            <div>
              <LoadingSkeleton className="h-8 w-96 mb-4" />
              <LoadingSkeleton className="h-4 w-full max-w-4xl" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="h-3 w-24" />
              <LoadingSkeleton className="h-3 w-20" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <LoadingSkeleton className="h-10 w-48" />
              <LoadingSkeleton className="h-10 w-40" />
            </div>
          </div>

          <div className="border-t border-gray-200 my-6" />

          {/* Modules */}
          <div className="space-y-6">
            <LoadingSkeleton className="h-6 w-48" />

            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <LoadingSkeleton className="h-5 w-20" />
                          <LoadingSkeleton className="h-3 w-32" />
                        </div>
                        <LoadingSkeleton className="h-5 w-3/4 mb-2" />
                        <LoadingSkeleton className="h-4 w-full" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Lessons Grid - 2 columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <div key={j} className="flex items-center gap-3 p-3 border border-gray-200">
                            <LoadingSkeleton className="w-8 h-8 rounded" />
                            <div className="flex-1">
                              <LoadingSkeleton className="h-4 w-full mb-1" />
                              <LoadingSkeleton className="h-3 w-5/6" />
                            </div>
                            <LoadingSkeleton className="h-4 w-4" />
                          </div>
                        ))}
                      </div>

                      {/* Module Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <LoadingSkeleton className="h-3 w-24" />
                        <div className="flex gap-2">
                          <LoadingSkeleton className="h-8 w-32" />
                          <LoadingSkeleton className="h-8 w-32" />
                        </div>
                      </div>
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

