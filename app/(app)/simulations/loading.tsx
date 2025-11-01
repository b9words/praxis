import { LoadingState } from '@/components/ui/loading-skeleton'
import LoadingSkeleton from '@/components/ui/loading-skeleton'

export default function SimulationsLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <LoadingSkeleton className="h-8 w-48 mb-2" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>
      <LoadingState type="article-grid" count={3} />
    </div>
  )
}
