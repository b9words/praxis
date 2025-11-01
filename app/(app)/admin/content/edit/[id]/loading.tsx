import { LoadingState } from '@/components/ui/loading-skeleton'

export default function EditContentLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <LoadingState type="dashboard" />
    </div>
  )
}

