'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface ReplyFormProps {
  threadId: string
}

export default function ReplyForm({ threadId }: ReplyFormProps) {
  const router = useRouter()
  
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/forum/threads/${threadId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentPostId: null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to post reply')
        setLoading(false)
        return
      }

      toast.success('Reply posted successfully')
      setContent('')
      router.refresh()
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Failed to post reply')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="reply">Add a reply</Label>
        <Textarea
          id="reply"
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
          className="mt-1"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? 'Posting...' : 'Post Reply'}
        </Button>
      </div>
    </form>
  )
}
