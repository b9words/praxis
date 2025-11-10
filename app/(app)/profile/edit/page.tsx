import { Suspense } from 'react'
import ProfileEditClient from './ProfileEditClient'
import { LoadingState } from '@/components/ui/loading-skeleton'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function ProfileEditPage() {
  return (
    <Suspense fallback={
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <LoadingState type="profile" />
      </div>
    }>
      <ProfileEditClient />
    </Suspense>
  )
}