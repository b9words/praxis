import { LoadingState } from '@/components/ui/loading-skeleton'

export default function LibraryLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-96 bg-gray-200 animate-pulse rounded" />
      </div>
      <LoadingState type="article-grid" count={6} />
    </div>
  )
}
