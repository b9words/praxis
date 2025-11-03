'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Filter, Download, X } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { toast } from 'sonner'

interface ContentItem {
  id: string
  type: 'article' | 'case'
  title: string
  status: string
  updatedAt: Date
  competency?: { name: string }
  storagePath?: string | null
  content?: string // For articles
  briefingDoc?: string // For cases
  creator?: { username: string }
  updater?: { username: string }
}

interface ContentManagementEnhancedProps {
  articles: ContentItem[]
  cases: ContentItem[]
}

export default function ContentManagementEnhanced({ articles, cases }: ContentManagementEnhancedProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('__all__')
  const [typeFilter, setTypeFilter] = useState<string>('__all__')
  const [competencyFilter, setCompetencyFilter] = useState<string>('__all__')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null)

  // Fetch full content for preview
  const getContentPreview = async (item: ContentItem) => {
    try {
      const response = await fetch(`/api/${item.type === 'article' ? 'articles' : 'cases'}/${item.id}`)
      const data = await response.json()
      return data[item.type]?.content || data[item.type]?.briefingDoc || ''
    } catch {
      return ''
    }
  }

  const allContent: ContentItem[] = useMemo(() => {
    const articleItems: ContentItem[] = articles.map((a) => ({
      ...a,
      type: 'article' as const,
    }))
    const caseItems: ContentItem[] = cases.map((c) => ({
      ...c,
      type: 'case' as const,
    }))
    return [...articleItems, ...caseItems]
  }, [articles, cases])

  const competencies = useMemo(() => {
    const comps = new Set<string>()
    articles.forEach((a) => {
      if (a.competency?.name) comps.add(a.competency.name)
    })
    return Array.from(comps).sort()
  }, [articles])

  const filteredContent = useMemo(() => {
    return allContent.filter((item) => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (statusFilter && statusFilter !== '__all__' && item.status !== statusFilter) {
        return false
      }
      if (typeFilter && typeFilter !== '__all__' && item.type !== typeFilter) {
        return false
      }
      if (competencyFilter && competencyFilter !== '__all__' && item.competency?.name !== competencyFilter) {
        return false
      }
      return true
    })
  }, [allContent, search, statusFilter, typeFilter, competencyFilter])

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = () => {
    if (selectedItems.size === filteredContent.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredContent.map((item) => item.id)))
    }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!confirm(`Change status to ${newStatus} for ${selectedItems.size} items?`)) {
      return
    }

    try {
      const selectedIds = Array.from(selectedItems)
      
      // Determine type: check if all selected items are the same type
      const selectedItemsData = filteredContent.filter(item => selectedIds.includes(item.id))
      const hasArticles = selectedItemsData.some(item => item.type === 'article')
      const hasCases = selectedItemsData.some(item => item.type === 'case')
      
      const type = hasArticles && hasCases ? 'both' : (hasArticles ? 'article' : 'case')

      const response = await fetch('/api/content/bulk-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds,
          type,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      const result = await response.json()
      toast.success(
        `Status updated: ${result.updated.articles} articles, ${result.updated.cases} cases`
      )
      setSelectedItems(new Set())
      
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    }
  }

  const exportToCSV = () => {
    const headers = ['Type', 'Title', 'Status', 'Competency', 'Updated']
    const rows = filteredContent.map((item) => [
      item.type,
      item.title,
      item.status,
      item.competency?.name || '',
      new Date(item.updatedAt).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All types</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="case">Cases</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Competency</Label>
              <Select value={competencyFilter} onValueChange={setCompetencyFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All competencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All competencies</SelectItem>
                  {competencies.map((comp) => (
                    <SelectItem key={comp} value={comp}>
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(search || (statusFilter && statusFilter !== '__all__') || (typeFilter && typeFilter !== '__all__') || (competencyFilter && competencyFilter !== '__all__')) && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('__all__')
                  setTypeFilter('__all__')
                  setCompetencyFilter('__all__')
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Select onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">To Draft</SelectItem>
                    <SelectItem value="in_review">To In Review</SelectItem>
                    <SelectItem value="approved">To Approved</SelectItem>
                    <SelectItem value="published">To Published</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content ({filteredContent.length})</CardTitle>
              <CardDescription>Showing {filteredContent.length} of {allContent.length} items</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedItems.size === filteredContent.length && filteredContent.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Competency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContent.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.competency?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewItem(item)}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/content/edit/${item.id}?type=${item.type}`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewItem?.title}</DialogTitle>
            <DialogDescription>
              {previewItem?.type} • {previewItem?.status} • {previewItem?.competency?.name}
            </DialogDescription>
          </DialogHeader>
          {previewItem && (
            <div className="mt-4">
              {previewItem.type === 'article' ? (
                <MarkdownRenderer content={previewItem.content || ''} />
              ) : (
                <MarkdownRenderer content={previewItem.briefingDoc || ''} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

