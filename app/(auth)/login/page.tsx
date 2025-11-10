import { Suspense } from 'react'
import LoginClient from './LoginClient'
import { LoadingState } from '@/components/ui/loading-skeleton'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingState type="dashboard" />
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}
