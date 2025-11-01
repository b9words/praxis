import { LoadingState } from '@/components/ui/loading-skeleton'

export default function SimulationWorkspaceLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <LoadingState type="simulation" />
    </div>
  )
}

