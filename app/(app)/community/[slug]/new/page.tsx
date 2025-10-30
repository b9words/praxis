'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function NewThreadPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [channel, setChannel] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    async function loadChannel() {
      // Fetch channel info from channels API
      const response = await fetch(`/api/forum/channels`)
      if (!response.ok) {
        toast.error('Failed to load channel')
        return
      }

      const { channels } = await response.json()
      const channelData = channels?.find((c: any) => c.slug === slug)
      if (channelData) {
        setChannel(channelData)
      } else {
        // Fallback: use slug as name
        setChannel({ slug, name: slug })
      }
    }
    loadChannel()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be logged in')
      setLoading(false)
      return
    }

    // Create thread using API route
    const response = await fetch(`/api/forum/channels/${slug}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      toast.error(error.error || 'Failed to create thread')
      setLoading(false)
      return
    }

    toast.success('Thread created successfully')
    router.push(`/community/${slug}`)
  }

  if (!channel) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Thread in #{channel.name}</h1>
        <p className="mt-2 text-gray-600">Start a new discussion</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="What's your thread about?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
               
            
                required
                className="mt-1"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/community/${slug}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title || !content}>
                {loading ? 'Creating...' : 'Create Thread'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
