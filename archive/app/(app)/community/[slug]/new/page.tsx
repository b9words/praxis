'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LoadingSkeleton from '@/components/ui/loading-skeleton'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function NewThreadPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // Fetch channels to find current channel
  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: queryKeys.forum.channels(),
    queryFn: ({ signal }) => fetchJson<{ channels: any[] }>('/api/forum/channels', { signal }),
    retry: 2,
  })

  const channel = channelsData?.channels?.find((c: any) => c.slug === slug) || { slug, name: slug }

  if (channelsLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <div className="mb-8">
          <LoadingSkeleton className="h-8 w-48 mb-2" />
          <LoadingSkeleton className="h-4 w-96" />
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <LoadingSkeleton className="h-10 w-full mb-4" />
          <LoadingSkeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  const createThreadMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in')
      return fetchJson(`/api/forum/channels/${slug}/threads`, {
        method: 'POST',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.threads.byChannel(slug) })
      toast.success('Thread created successfully')
      router.push(`/community/${slug}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create thread')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createThreadMutation.mutate({ title, content })
  }

  const loading = createThreadMutation.isPending

  if (!channel) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <LoadingSkeleton className="h-4 w-32" />
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Open a New Thread</h1>
        <p className="text-sm text-gray-600">Start an analytical discussion</p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Create Thread</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Thread title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 rounded-none"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your analytical insights..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="mt-1 rounded-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/community/${slug}`)}
                  className="border-gray-300 hover:border-gray-400 rounded-none"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !title || !content} className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
                  {loading ? 'Opening thread...' : 'Open Thread'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
