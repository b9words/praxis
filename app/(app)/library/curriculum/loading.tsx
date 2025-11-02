import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function CurriculumLoading() {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4 md:px-6 md:py-6 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <LoadingSkeleton className="h-7 w-80" />
            <LoadingSkeleton className="h-4 w-full max-w-3xl" />

            {/* Stats - 4 badges in a row */}
            <div className="flex gap-6 mt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <LoadingSkeleton className="h-6 w-12 mx-auto mb-1" />
                  <LoadingSkeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Domain Cards - 2 column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-neutral-50 border border-neutral-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <LoadingSkeleton className="h-5 w-3/4 mb-2" />
                      <LoadingSkeleton className="h-4 w-full mb-2" />
                      <LoadingSkeleton className="h-4 w-5/6" />
                    </div>
                    <LoadingSkeleton className="h-3 w-8" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 mb-4">
                    <LoadingSkeleton className="h-3 w-20" />
                    <LoadingSkeleton className="h-3 w-20" />
                    <LoadingSkeleton className="h-3 w-16" />
                  </div>

                  {/* Sample Modules */}
                  <div className="space-y-2">
                    <LoadingSkeleton className="h-3 w-24" />
                    <div className="space-y-1">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <LoadingSkeleton key={j} className="h-3 w-full max-w-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

