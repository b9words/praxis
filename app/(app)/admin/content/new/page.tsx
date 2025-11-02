'use client'

import ContentEditor from '@/components/admin/ContentEditor'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewContentForm() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'article'

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


