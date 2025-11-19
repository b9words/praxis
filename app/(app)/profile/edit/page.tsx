import { Suspense } from 'react'
import ProfileEditClient from './ProfileEditClient'
import { LoadingState } from '@/components/ui/loading-skeleton'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function ProfileEditPage() {
  return (
    <Suspense fallback={<LoadingState type="profile" />}>
      <ProfileEditClient />
    </Suspense>
  )
}