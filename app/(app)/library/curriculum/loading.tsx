import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function CurriculumLoading() {
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
          {/* Stats section skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-neutral-200">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-neutral-50 border border-neutral-200 p-3">
                <LoadingSkeleton className="h-6 w-16 mb-2" />
                <LoadingSkeleton className="h-3 w-20" />
              </div>
            ))}
          </div>

          {/* Curriculum tree skeleton */}
          <div className="p-4 space-y-6">
            {Array.from({ length: 3 }).map((_, domainIdx) => (
              <div key={domainIdx} className="bg-neutral-50 border border-neutral-200 p-4">
                <LoadingSkeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3 ml-4">
                  {Array.from({ length: 2 }).map((_, moduleIdx) => (
                    <div key={moduleIdx} className="space-y-2">
                      <LoadingSkeleton className="h-5 w-40" />
                      <div className="ml-4 space-y-1">
                        {Array.from({ length: 3 }).map((_, lessonIdx) => (
                          <LoadingSkeleton key={lessonIdx} className="h-4 w-full max-w-md" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

