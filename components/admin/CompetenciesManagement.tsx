'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, ChevronRight, ChevronDown, GripVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Competency {
  id: string
  name: string
  description: string | null
  parentId: string | null
  level: string
  residencyYear: number | null
  displayOrder: number
  parent?: { id: string; name: string } | null
  children?: Array<{ id: string; name: string; level: string }>
  articles?: Array<{ id: string }>
}

interface CompetenciesManagementProps {
  initialCompetencies: Competency[]
}

export default function CompetenciesManagement({ initialCompetencies }: CompetenciesManagementProps) {
  const [competencies, setCompetencies] = useState(initialCompetencies)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '__none__',
    level: 'competency' as 'domain' | 'competency' | 'micro_skill',
    residencyYear: '',
    displayOrder: '0',
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return fetchJson<{ competency: Competency }>('/api/competencies', {
        method: 'POST',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competencies'] })
      toast.success('Competency created successfully')
      setIsCreateOpen(false)
      // Refresh will happen via query invalidation
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create competency')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJson<{ competency: Competency }>(`/api/competencies/${id}`, {
        method: 'PUT',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competencies'] })
      toast.success('Competency updated successfully')
      setEditingId(null)
      setIsEditOpen(false)
      setFormData({
        name: '',
        description: '',
        parentId: '__none__',
        level: 'competency',
        residencyYear: '',
        displayOrder: '0',
      })
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update competency')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchJson(`/api/competencies/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competencies'] })
      toast.success('Competency deleted successfully')
      window.location.reload()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete competency')
    },
  })

  // Populate form when editingId changes
  useEffect(() => {
    if (editingId) {
      const comp = competencies.find((c) => c.id === editingId)
      if (comp) {
        setFormData({
          name: comp.name,
          description: comp.description || '',
          parentId: comp.parentId || '__none__',
          level: comp.level as 'domain' | 'competency' | 'micro_skill',
          residencyYear: comp.residencyYear ? String(comp.residencyYear) : '',
          displayOrder: String(comp.displayOrder),
        })
        setIsEditOpen(true)
      }
    }
  }, [editingId, competencies])

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      parentId: formData.parentId && formData.parentId !== '__none__' ? formData.parentId : null,
      level: formData.level,
      residencyYear: formData.residencyYear ? parseInt(formData.residencyYear) : null,
      displayOrder: parseInt(formData.displayOrder),
    })
  }

  const handleUpdate = () => {
    if (!editingId) return
    updateMutation.mutate({
      id: editingId,
      data: {
        name: formData.name,
        description: formData.description || null,
        parentId: formData.parentId && formData.parentId !== '__none__' ? formData.parentId : null,
        level: formData.level,
        residencyYear: formData.residencyYear ? parseInt(formData.residencyYear) : null,
        displayOrder: parseInt(formData.displayOrder),
      },
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this competency? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  // Organize into tree structure
  const buildTree = (items: Competency[]): Competency[] => {
    const itemMap = new Map<string, Competency>()
    const rootItems: Competency[] = []

    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] })
    })

    items.forEach((item) => {
      const node = itemMap.get(item.id)!
      if (item.parentId) {
        const parent = itemMap.get(item.parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(node)
        }
      } else {
        rootItems.push(node)
      }
    })

    return rootItems
  }

  const tree = buildTree(competencies)

  const renderCompetency = (comp: Competency, depth: number = 0) => {
    const hasChildren = comp.children && comp.children.length > 0
    const isExpanded = expandedItems.has(comp.id)
    const isEditing = editingId === comp.id
    const articleCount = comp.articles?.length || 0

    return (
      <div key={comp.id} className="border-b border-gray-200">
        <div className="flex items-center gap-2 py-3 px-4 hover:bg-gray-50" style={{ paddingLeft: `${depth * 24 + 16}px` }}>
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(comp.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <div className="w-4" />
            )}
            <GripVertical className="h-4 w-4 text-gray-400" />
            <Badge variant="outline" className="text-xs">
              {comp.level}
            </Badge>
            <span className="font-medium">{comp.name}</span>
            {comp.description && (
              <span className="text-sm text-gray-500">- {comp.description}</span>
            )}
            {comp.residencyYear && (
              <Badge variant="outline" className="text-xs">
                Year {comp.residencyYear}
              </Badge>
            )}
            {articleCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {articleCount} article{articleCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingId(comp.id)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(comp.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {comp.children!.map((child) => {
              const fullChild = competencies.find((c) => c.id === child.id)
              return fullChild ? renderCompetency(fullChild, depth + 1) : null
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Competencies Management</h1>
          <p className="text-sm text-gray-600">Manage the competency hierarchy and organization</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
              <Plus className="h-4 w-4 mr-2" />
              New Competency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Competency</DialogTitle>
              <DialogDescription>Add a new competency to the hierarchy</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Financial Acumen"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this competency"
                  rows={3}
                />
              </div>
              <div>
                <Label>Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(val: any) => setFormData({ ...formData, level: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="competency">Competency</SelectItem>
                    <SelectItem value="micro_skill">Micro Skill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Parent Competency</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(val) => setFormData({ ...formData, parentId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (top level)</SelectItem>
                    {competencies
                      .filter((c) => c.id !== formData.parentId)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.level})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Residency Year</Label>
                  <Input
                    type="number"
                    value={formData.residencyYear}
                    onChange={(e) => setFormData({ ...formData, residencyYear: e.target.value })}
                    placeholder="Optional"
                    min="1"
                    max="4"
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsCreateOpen(false)
                  setFormData({
                    name: '',
                    description: '',
                    parentId: '__none__',
                    level: 'competency',
                    residencyYear: '',
                    displayOrder: '0',
                  })
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open)
        if (!open) {
          setEditingId(null)
          setFormData({
            name: '',
            description: '',
            parentId: '__none__',
            level: 'competency',
            residencyYear: '',
            displayOrder: '0',
          })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Competency</DialogTitle>
            <DialogDescription>Update competency information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Financial Acumen"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this competency"
                rows={3}
              />
            </div>
            <div>
              <Label>Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(val: any) => setFormData({ ...formData, level: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="competency">Competency</SelectItem>
                  <SelectItem value="micro_skill">Micro Skill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parent Competency</Label>
              <Select
                value={formData.parentId}
                onValueChange={(val) => setFormData({ ...formData, parentId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (top level)</SelectItem>
                  {competencies
                    .filter((c) => c.id !== editingId && c.id !== formData.parentId)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Residency Year</Label>
                <Input
                  type="number"
                  value={formData.residencyYear}
                  onChange={(e) => setFormData({ ...formData, residencyYear: e.target.value })}
                  placeholder="Optional"
                  min="1"
                  max="4"
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditOpen(false)
                setEditingId(null)
                setFormData({
                  name: '',
                  description: '',
                  parentId: '__none__',
                  level: 'competency',
                  residencyYear: '',
                  displayOrder: '0',
                })
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.name || updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Competency Hierarchy</CardTitle>
          <CardDescription>Organized by parent-child relationships</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {tree.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No competencies found. Create your first one above.
              </div>
            ) : (
              tree.map((comp) => renderCompetency(comp))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

