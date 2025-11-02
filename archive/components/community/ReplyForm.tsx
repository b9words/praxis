'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface ReplyFormProps {
  threadId: string
}

export default function ReplyForm({ threadId }: ReplyFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [content, setContent] = useState('')

  const createPostMutation = useMutation({
    mutationFn: (data: { content: string; parentPostId: string | null }) =>
      fetchJson(`/api/forum/threads/${threadId}/posts`, {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      toast.success('Reply posted successfully')
      setContent('')
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts.byThread(threadId) })
      router.refresh() // Keep refresh for server-rendered thread page
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to post reply')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPostMutation.mutate({
      content,
      parentPostId: null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="reply">Add to Analysis</Label>
        <Textarea
          id="reply"
          placeholder="Share your analytical insights..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          className="mt-1 rounded-none"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={createPostMutation.isPending || !content.trim()} className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
          {createPostMutation.isPending ? 'Posting...' : 'Post Reply'}
        </Button>
      </div>
    </form>
  )
}
