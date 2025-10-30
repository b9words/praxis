import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingState({
  message = 'Loading...',
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        {content}
      </div>
    )
  }

  return <div className="py-16">{content}</div>
}

