import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function DebriefLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="bg-white border border-neutral-200 p-6">
        <LoadingSkeleton className="h-7 w-64 mb-2" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>

      {/* Overall Score KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 p-6">
            <LoadingSkeleton className="h-3 w-32 mb-2" />
            <LoadingSkeleton className="h-8 w-16 mb-1" />
            <LoadingSkeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      <div className="bg-white border border-neutral-200 p-6 space-y-3">
        <LoadingSkeleton className="h-5 w-40" />
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-full max-w-3xl" />
        <LoadingSkeleton className="h-4 w-5/6 max-w-3xl" />
      </div>

      {/* Score Breakdown and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 p-6 space-y-3">
          <LoadingSkeleton className="h-5 w-40" />
          <LoadingSkeleton className="h-40 w-full" />
        </div>
        <div className="bg-white border border-neutral-200 p-6 space-y-3">
          <LoadingSkeleton className="h-5 w-40" />
          <LoadingSkeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  )
}

