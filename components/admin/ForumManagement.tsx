'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, Pin, PinOff, MessageSquare, Hash } from 'lucide-react'
import { fetchJson } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'

interface Channel {
  id: string
  name: string
  slug: string
  description: string | null
  threads?: Array<{ id: string }>
}

interface Thread {
  id: string
  title: string
  isPinned: boolean
  createdAt: Date
  author: {
    id: string
    username: string
    fullName: string | null
  }
  channel: {
    id: string
    name: string
    slug: string
  }
  posts?: Array<{ id: string }>
}

interface Post {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    username: string
  }
  thread: {
    id: string
    title: string
  }
}

interface ForumManagementProps {
  initialChannels: Channel[]
  initialThreads: Thread[]
  initialPosts: Post[]
}

export default function ForumManagement({
  initialChannels,
  initialThreads,
  initialPosts,
}: ForumManagementProps) {
  const queryClient = useQueryClient()
  const [isChannelCreateOpen, setIsChannelCreateOpen] = useState(false)
  const [channelForm, setChannelForm] = useState({ name: '', slug: '', description: '' })

  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      return fetchJson('/api/forum/channels', {
        method: 'POST',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] })
      toast.success('Channel created successfully')
      setIsChannelCreateOpen(false)
      setChannelForm({ name: '', slug: '', description: '' })
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create channel')
    },
  })

  const pinThreadMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      return fetchJson(`/api/forum/threads/${id}`, {
        method: 'PATCH',
        body: { isPinned },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] })
      toast.success('Thread pin status updated')
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update thread')
    },
  })

  const deleteThreadMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchJson(`/api/forum/threads/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] })
      toast.success('Thread deleted successfully')
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete thread')
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchJson(`/api/forum/posts/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum'] })
      toast.success('Post deleted successfully')
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete post')
    },
  })

  const handleCreateChannel = () => {
    if (!channelForm.name || !channelForm.slug) {
      toast.error('Name and slug are required')
      return
    }
    createChannelMutation.mutate(channelForm)
  }

  const handlePinThread = (id: string, currentPin: boolean) => {
    pinThreadMutation.mutate({ id, isPinned: !currentPin })
  }

  const handleDeleteThread = (id: string) => {
    if (confirm('Are you sure you want to delete this thread? This will also delete all posts in the thread.')) {
      deleteThreadMutation.mutate(id)
    }
  }

  const handleDeletePost = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Forum Management</h1>
          <p className="text-sm text-gray-600">Manage forum channels, threads, and posts</p>
        </div>
      </div>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList>
          <TabsTrigger value="channels">Channels ({initialChannels.length})</TabsTrigger>
          <TabsTrigger value="threads">Recent Threads ({initialThreads.length})</TabsTrigger>
          <TabsTrigger value="posts">Recent Posts ({initialPosts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Forum Channels</CardTitle>
                <Dialog open={isChannelCreateOpen} onOpenChange={setIsChannelCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Channel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Channel</DialogTitle>
                      <DialogDescription>Add a new forum channel</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={channelForm.name}
                          onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                          placeholder="e.g., General Discussion"
                        />
                      </div>
                      <div>
                        <Label>Slug *</Label>
                        <Input
                          value={channelForm.slug}
                          onChange={(e) => setChannelForm({ ...channelForm, slug: e.target.value })}
                          placeholder="e.g., general"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={channelForm.description}
                          onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                          placeholder="Channel description"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsChannelCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateChannel} disabled={createChannelMutation.isPending}>
                          {createChannelMutation.isPending ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {initialChannels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Hash className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        {channel.description && (
                          <div className="text-sm text-gray-500">{channel.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {channel.threads?.length || 0} threads
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Threads</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {initialThreads.map((thread) => (
                  <div key={thread.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {thread.isPinned && (
                            <Pin className="h-4 w-4 text-amber-500" />
                          )}
                          <Link
                            href={`/community/${thread.channel.slug}/${thread.id}`}
                            className="font-medium text-gray-900 hover:text-gray-700"
                          >
                            {thread.title}
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500">
                          by {thread.author.username} in {thread.channel.name} • {thread.posts?.length || 0} replies
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePinThread(thread.id, thread.isPinned)}
                          title={thread.isPinned ? 'Unpin' : 'Pin'}
                        >
                          {thread.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteThread(thread.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                {initialPosts.map((post) => (
                  <div key={post.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 mb-1 line-clamp-2">{post.content}</div>
                        <div className="text-xs text-gray-500">
                          by {post.author.username} in thread: {post.thread.title}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

