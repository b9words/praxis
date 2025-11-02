import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function CaseStudiesLoading() {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <LoadingSkeleton className="h-7 w-64" />
            <LoadingSkeleton className="h-4 w-full max-w-3xl" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-neutral-200 p-4">
                <div className="flex items-center gap-3">
                  <LoadingSkeleton className="h-5 w-5 rounded" />
                  <div>
                    <LoadingSkeleton className="h-6 w-8 mb-1" />
                    <LoadingSkeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Case Studies Grid - 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-neutral-200 hover:border-neutral-300 transition-colors">
                <div className="p-6">
                  {/* Title and Difficulty Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <LoadingSkeleton className="h-5 w-3/4 mb-2" />
                      <LoadingSkeleton className="h-4 w-full" />
                    </div>
                    <LoadingSkeleton className="h-5 w-16" />
                  </div>
                  
                  {/* Competency Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <LoadingSkeleton className="h-5 w-24" />
                    <LoadingSkeleton className="h-5 w-28" />
                    <LoadingSkeleton className="h-5 w-20" />
                  </div>
                  
                  {/* Metadata and Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <LoadingSkeleton className="h-3 w-16" />
                      <LoadingSkeleton className="h-3 w-24" />
                    </div>
                    <LoadingSkeleton className="h-9 w-28" />
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

