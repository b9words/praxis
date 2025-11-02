import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function CaseBriefLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-3/4 mb-2" />
        <LoadingSkeleton className="h-4 w-48" />
      </div>

      {/* Prerequisites Banner (optional - skeleton representation) */}
      <div className="border border-yellow-200 bg-yellow-50 mb-6 rounded-lg p-4">
        <div className="flex items-start gap-2 mb-2">
          <LoadingSkeleton className="h-4 w-4 rounded-full" />
          <LoadingSkeleton className="h-5 w-48" />
        </div>
        <div className="ml-6 space-y-2">
          <LoadingSkeleton className="h-4 w-full max-w-2xl" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-white border border-yellow-200 rounded">
              <LoadingSkeleton className="h-4 w-4 rounded-full" />
              <LoadingSkeleton className="h-3 w-64" />
              <LoadingSkeleton className="h-3 w-16" />
            </div>
          ))}
          <LoadingSkeleton className="h-3 w-48 mt-2" />
        </div>
      </div>

      {/* Briefing Documents Card */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <LoadingSkeleton className="h-6 w-40" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <LoadingSkeleton key={i} className={`h-4 ${i === 11 ? 'w-5/6' : 'w-full'}`} />
          ))}
        </div>
      </div>

      {/* Case Data Card (optional) */}
      <div className="bg-white border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <LoadingSkeleton className="h-6 w-32" />
        </div>
        <div className="p-6">
          <LoadingSkeleton className="h-48 w-full rounded" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-10 w-48" />
        <LoadingSkeleton className="h-10 w-48" />
      </div>
    </div>
  )
}

