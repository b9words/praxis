import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function ProfileLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 mb-12">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <LoadingSkeleton className="h-20 w-20 rounded-full" />
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <LoadingSkeleton className="h-7 w-48 mb-1" />
                  <LoadingSkeleton className="h-4 w-32 mb-3" />
                  <LoadingSkeleton className="h-4 w-64" />
                </div>
                <LoadingSkeleton className="h-9 w-32" />
              </div>

              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-6">
                <LoadingSkeleton className="h-3 w-32" />
                <LoadingSkeleton className="h-3 w-40" />
                <LoadingSkeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Matrix */}
      <div className="bg-white border border-gray-200 mb-12">
        <div className="border-b border-gray-200 px-6 py-4">
          <LoadingSkeleton className="h-5 w-48 mb-1" />
          <LoadingSkeleton className="h-3 w-64" />
        </div>
        <div className="p-6">
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Engagement History */}
      <div className="bg-white border border-gray-200 mb-12">
        <div className="border-b border-gray-200 px-6 py-4">
          <LoadingSkeleton className="h-5 w-48 mb-1" />
          <LoadingSkeleton className="h-3 w-40" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <LoadingSkeleton className="h-5 w-64" />
                  <LoadingSkeleton className="h-5 w-16" />
                </div>
                <LoadingSkeleton className="h-3 w-32" />
              </div>
              <LoadingSkeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

