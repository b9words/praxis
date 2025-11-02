'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchJson } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, GripVertical, Search, X } from 'lucide-react'

interface LearningPathItem {
  id?: string
  order: number
  type: 'lesson' | 'case'
  domain?: string | null
  module?: string | null
  lesson?: string | null
  caseId?: string | null
}

interface LearningPath {
  id: string
  slug: string
  title: string
  description?: string | null
  duration: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  items: LearningPathItem[]
}

interface SearchResult {
  lessons: Array<{
    type: 'lesson'
    id: string
    title: string
    domain: string
    module: string
    lesson: string
    metadata: {
      moduleTitle: string
      domainTitle: string
    }
  }>
  cases: Array<{
    type: 'case'
    id: string
    title: string
    caseId: string
    metadata: {
      description?: string
    }
  }>
}

export default function LearningPathsManager() {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)

  // Fetch all learning paths
  const { data: paths, isLoading } = useQuery<{ paths: LearningPath[] }>({
    queryKey: ['admin', 'learning-paths'],
    queryFn: () => fetchJson('/api/admin/learning-paths'),
  })

  // Search for lessons and cases
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      return fetchJson<SearchResult>(`/api/admin/learning-paths/search?q=${encodeURIComponent(query)}`)
    },
    onSuccess: (data) => {
      setSearchResults(data)
    },
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      searchMutation.mutate(query)
    } else {
      setSearchResults(null)
    }
  }

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LearningPath>) => {
      return fetchJson<{ path: LearningPath }>('/api/admin/learning-paths', {
        method: 'POST',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'learning-paths'] })
      setIsCreating(false)
      toast.success('Learning path created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create learning path')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LearningPath> }) => {
      return fetchJson<{ path: LearningPath }>(`/api/admin/learning-paths/${id}`, {
        method: 'PUT',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'learning-paths'] })
      setEditingPath(null)
      toast.success('Learning path updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update learning path')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchJson(`/api/admin/learning-paths/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'learning-paths'] })
      toast.success('Learning path deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete learning path')
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this learning path?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Learning Paths</h2>
          <p className="text-sm text-gray-600">Manage curated learning paths for your users</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Path
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Learning Path</DialogTitle>
              <DialogDescription>Create a new curated learning path</DialogDescription>
            </DialogHeader>
            <LearningPathForm
              onSubmit={(data) => {
                createMutation.mutate(data)
              }}
              onCancel={() => setIsCreating(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Paths List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : paths?.paths.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No learning paths yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paths?.paths.map((path) => (
            <Card key={path.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{path.title}</CardTitle>
                      <Badge variant={path.status === 'published' ? 'default' : 'secondary'}>
                        {path.status}
                      </Badge>
                    </div>
                    <CardDescription>{path.description || 'No description'}</CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Duration: {path.duration}</span>
                      <span>Items: {path.items.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPath(path)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(path.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {path.items.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {path.items.map((item, index) => (
                      <div key={item.id || index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{item.type === 'lesson' ? 'Lesson' : 'Case'}:</span>
                        <span className="text-gray-700">
                          {item.type === 'lesson'
                            ? `${item.domain}/${item.module}/${item.lesson}`
                            : item.caseId}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingPath && (
        <Dialog open={!!editingPath} onOpenChange={(open) => !open && setEditingPath(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Learning Path</DialogTitle>
              <DialogDescription>Update learning path details and items</DialogDescription>
            </DialogHeader>
            <LearningPathForm
              initialData={editingPath}
              onSubmit={(data) => {
                updateMutation.mutate({ id: editingPath.id, data })
              }}
              onCancel={() => setEditingPath(null)}
              searchQuery={searchQuery}
              searchResults={searchResults}
              onSearch={handleSearch}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface LearningPathFormProps {
  initialData?: LearningPath
  onSubmit: (data: Partial<LearningPath>) => void
  onCancel: () => void
  searchQuery?: string
  searchResults?: SearchResult | null
  onSearch?: (query: string) => void
}

function LearningPathForm({
  initialData,
  onSubmit,
  onCancel,
  searchQuery = '',
  searchResults,
  onSearch,
}: LearningPathFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [duration, setDuration] = useState(initialData?.duration || '')
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft')
  const [items, setItems] = useState<LearningPathItem[]>(initialData?.items || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description: description || undefined,
      duration,
      status,
      items,
    })
  }

  const addItem = (item: LearningPathItem) => {
    setItems([...items, { ...item, order: items.length }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })))
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items]
    const [moved] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, moved)
    setItems(newItems.map((item, i) => ({ ...item, order: i })))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., The M&A Toolkit (7-Day Sprint)"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the learning path"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Duration *</Label>
          <Input
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            placeholder="e.g., 7 days"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v: 'draft' | 'published') => setStatus(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items List */}
      <div>
        <Label>Items ({items.length})</Label>
        <div className="space-y-2 mt-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
              <span className="flex-1 text-sm">
                {item.type === 'lesson'
                  ? `Lesson: ${item.domain}/${item.module}/${item.lesson}`
                  : `Case: ${item.caseId}`}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Search and Add Items */}
        {onSearch && (
          <div className="mt-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search lessons and cases..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {searchResults && (searchResults.lessons.length > 0 || searchResults.cases.length > 0) && (
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                {searchResults.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      addItem({
                        type: 'lesson',
                        domain: lesson.domain,
                        module: lesson.module,
                        lesson: lesson.lesson,
                        order: items.length,
                      })
                      onSearch('')
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm">{lesson.title}</div>
                      <div className="text-xs text-gray-500">{lesson.metadata.domainTitle} / {lesson.metadata.moduleTitle}</div>
                    </div>
                    <Badge variant="outline">Lesson</Badge>
                  </div>
                ))}
                {searchResults.cases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      addItem({
                        type: 'case',
                        caseId: caseItem.caseId,
                        order: items.length,
                      })
                      onSearch('')
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm">{caseItem.title}</div>
                    </div>
                    <Badge variant="outline">Case</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white">
          {initialData ? 'Update' : 'Create'} Path
        </Button>
      </div>
    </form>
  )
}

