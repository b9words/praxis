'use client'

import ContentEditor from '@/components/admin/ContentEditor'
import { LoadingState } from '@/components/ui/loading-skeleton'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function EditContentForm({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const [contentId, setContentId] = useState<string>('')
  const [contentType, setContentType] = useState<'article' | 'case'>('article')

  // Resolve contentId and contentType
  useEffect(() => {
    params.then((resolved) => {
      setContentId(resolved.id)
    })
    const type = searchParams.get('type') || 'article'
    setContentType(type as 'article' | 'case')
  }, [params, searchParams])

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      {contentId && (
        <ContentEditor
          contentType={contentType}
          mode="edit"
          contentId={contentId}
        />
      )}
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


