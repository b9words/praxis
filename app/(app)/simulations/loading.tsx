import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function SimulationsLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-48 mb-2" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200">
            <div className="p-6">
              {/* Title and Badge Area */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <LoadingSkeleton className="h-5 flex-1" />
                <LoadingSkeleton className="h-5 w-20" />
              </div>
              
              {/* Difficulty and Time Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <LoadingSkeleton className="h-5 w-20" />
                <LoadingSkeleton className="h-5 w-16" />
              </div>
              
              {/* Competency Badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                <LoadingSkeleton className="h-5 w-24" />
                <LoadingSkeleton className="h-5 w-28" />
                <LoadingSkeleton className="h-5 w-20" />
              </div>
              
              {/* Description Preview */}
              <div className="mb-4 space-y-2">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-5/6" />
              </div>
              
              {/* Button */}
              <LoadingSkeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
