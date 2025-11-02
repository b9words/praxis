'use client'

import ContentEditor from '@/components/admin/ContentEditor'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function EditContentForm({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'article'

  // Resolve contentId
  const [contentId, setContentId] = useState<string>('')
  useEffect(() => {
    params.then((resolved) => {
      setContentId(resolved.id)
    })
  }, [params])

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <ContentEditor
        contentType={type as 'article' | 'case'}
        mode="edit"
        contentId={contentId}
      />
    </div>
  )
}

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <LoadingState type="dashboard" />
      </div>
    }>
      <EditContentForm params={params} />
    </Suspense>
  )
}


