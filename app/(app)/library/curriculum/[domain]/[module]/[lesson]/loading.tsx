import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function LessonLoading() {
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
          {/* Breadcrumbs */}
          <div className="p-4 border-b border-neutral-200">
            <LoadingSkeleton className="h-4 w-64" />
          </div>

          {/* Lesson header */}
          <div className="p-4 space-y-4">
            <LoadingSkeleton className="h-8 w-3/4" />
            <LoadingSkeleton className="h-4 w-full" />
            <div className="flex gap-4">
              <LoadingSkeleton className="h-5 w-24" />
              <LoadingSkeleton className="h-5 w-24" />
            </div>
          </div>

          {/* Lesson content skeleton */}
          <div className="p-4">
            <div className="space-y-4">
              {Array.from({ length: 15 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

