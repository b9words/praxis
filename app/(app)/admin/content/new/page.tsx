'use client'

import ContentEditor from '@/components/admin/ContentEditor'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { fetchJson } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewContentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'article'

  // Check permission
  const { data: profileData, isLoading: loading } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: ({ signal }) => fetchJson<{ profile: { role: string } }>('/api/auth/profile', { signal }),
    retry: false,
    onError: () => {
      router.push('/login')
    },
  })

  const hasPermission = profileData?.profile?.role === 'admin' || profileData?.profile?.role === 'editor'

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <LoadingState type="dashboard" />
      </div>
    )
  }

  if (!hasPermission) {
    if (profileData) {
      router.push('/dashboard')
    }
    return null
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <ContentEditor
        contentType={type as 'article' | 'case'}
        mode="create"
      />
    </div>
  )
}

export default function NewContentPage() {
  return (
    <Suspense fallback={
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <LoadingState type="dashboard" />
      </div>
    }>
      <NewContentForm />
    </Suspense>
  )
}


