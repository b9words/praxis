'use client'

import ContentEditor from '@/components/admin/ContentEditor'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function NewContentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'article'
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    async function checkPermission() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
        router.push('/dashboard')
        return
      }

      setHasPermission(true)
      setLoading(false)
    }

    checkPermission()
  }, [supabase, router])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!hasPermission) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto">
      <ContentEditor
        contentType={type as 'article' | 'case'}
        mode="create"
      />
    </div>
  )
}

export default function NewContentPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <NewContentForm />
    </Suspense>
  )
}


