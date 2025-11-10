'use client'

import CaseAssetsManager from '@/components/admin/CaseAssetsManager'
import ContentEditorModal from '@/components/admin/ContentEditorModal'
import StorageEditorModal from '@/components/admin/StorageEditorModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Download, Edit, ExternalLink, Eye, FileText, MoreVertical, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface ContentItem {
  id: string
  type: 'article' | 'case'
  title: string
  status: string
  published?: boolean
  updatedAt: Date
  competency?: { name: string }
  storagePath?: string | null
  metadata?: Record<string, any>
  creator?: { username: string }
  updater?: { username: string }
}

// Helper function to generate public URL for content
function getPublicUrl(item: ContentItem): string | null {
  if (item.type === 'case') {
    return `/library/case-studies/${item.id}`
  }
  
  if (item.type === 'article') {
    // Parse from storagePath (most reliable)
    if (item.storagePath) {
      // Storage path format: content/curriculum/{domain}/{module}/{lesson}.md
      // or {domain}/{module}/{lesson}.md
      // or just the filename pattern: {domain}/{module}/{lesson}.md
      const pathMatch = item.storagePath.match(/(?:content\/curriculum\/)?([^\/]+)\/([^\/]+)\/([^\/]+)\.md$/)
      if (pathMatch) {
        const [, domain, module, lesson] = pathMatch
        return `/library/curriculum/${domain}/${module}/${lesson}`
      }
      
      // Alternative: try to match just the last three path segments
      const segments = item.storagePath.split('/').filter(Boolean)
      if (segments.length >= 3) {
        const lessonFile = segments[segments.length - 1]
        const module = segments[segments.length - 2]
        const domain = segments[segments.length - 3]
        if (lessonFile.endsWith('.md')) {
          const lesson = lessonFile.replace('.md', '')
          return `/library/curriculum/${domain}/${module}/${lesson}`
        }
      }
    }
    
    // Fallback: try metadata (less reliable as lesson ID might not be in metadata)
    const metadata = item.metadata || {}
    if (metadata.domain && metadata.module && item.storagePath) {
      // Extract lesson from storage path filename
      const lessonMatch = item.storagePath.match(/([^\/]+)\.md$/)
      if (lessonMatch) {
        const lesson = lessonMatch[1]
        return `/library/curriculum/${metadata.domain}/${metadata.module}/${lesson}`
      }
    }
  }
  
  return null
}

interface AdminContentTableProps {
  items: ContentItem[]
  selectedItems: Set<string>
  onSelectItem: (id: string) => void
  onSelectAll: () => void
  onBulkStatusChange: (status: string) => void
  onOpenDetails: (item: ContentItem) => void
  filters: {
    search: string
    type: string
    status: string
    arena?: string
    competency?: string
  }
  isLoading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    onPageChange: (page: number, pageSize?: number) => void
  }
}

export default function AdminContentTable({
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onBulkStatusChange,
  onOpenDetails,
  filters,
  isLoading = false,
  pagination,
}: AdminContentTableProps) {
  const router = useRouter()
  const allSelected = items.length > 0 && selectedItems.size === items.length
  const someSelected = selectedItems.size > 0 && selectedItems.size < items.length
  const [storageEditorOpen, setStorageEditorOpen] = useState(false)
  const [storageEditorItem, setStorageEditorItem] = useState<ContentItem | null>(null)
  const [assetsManagerOpen, setAssetsManagerOpen] = useState(false)
  const [assetsManagerCaseId, setAssetsManagerCaseId] = useState<string | null>(null)
  const [contentEditorItem, setContentEditorItem] = useState<ContentItem | null>(null)
  const [contentEditorOpen, setContentEditorOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const queryClient = useQueryClient()

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    in_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
  }

  // Bulk status change is handled by parent component

  const exportToCSV = () => {
    const headers = ['Type', 'Title', 'Status', 'Competency', 'Updated']
    const rows = items.map((item) => [
      item.type,
      item.title,
      item.status,
      item.competency?.name || '',
      new Date(item.updatedAt).toISOString(),
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="border rounded-lg bg-white flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-2 border-b flex items-center justify-between gap-2 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
          />
          <span className="text-xs text-muted-foreground">
            {selectedItems.size > 0 ? `${selectedItems.size} selected` : `${items.length} items`}
          </span>
          {selectedItems.size > 0 && (
            <Select onValueChange={onBulkStatusChange}>
              <SelectTrigger className="h-7 text-xs w-[140px]">
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="h-7 text-xs">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/50 sticky top-0 z-10">
            <tr>
              <th className="w-10 px-2 py-1.5 text-left">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-3 py-1.5 text-left font-medium text-xs text-muted-foreground">Type</th>
              <th className="px-3 py-1.5 text-left font-medium text-xs text-muted-foreground">Title</th>
              <th className="px-3 py-1.5 text-left font-medium text-xs text-muted-foreground">Status</th>
              <th className="px-3 py-1.5 text-left font-medium text-xs text-muted-foreground">Published</th>
              <th className="px-3 py-1.5 text-left font-medium text-xs text-muted-foreground">
                Competency
              </th>
              <th className="px-3 py-1.5 text-left font-medium text-xs text-muted-foreground">Updated</th>
              <th className="w-10 px-2 py-1.5 text-left">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No content found
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedItems.has(item.id)
                return (
                  <tr
                    key={item.id}
                    className={`
                      border-b hover:bg-gray-50/50 transition-colors cursor-pointer
                      ${isSelected ? 'bg-blue-50/50' : ''}
                    `}
                    onClick={() => onOpenDetails(item)}
                  >
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelectItem(item.id)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {item.type === 'article' ? 'Article' : 'Case'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium truncate max-w-[300px]" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={item.published ?? false}
                        onCheckedChange={async (checked) => {
                          try {
                            const response = await fetch(`/api/admin/content/${item.type === 'article' ? 'articles' : 'cases'}/${item.id}/publish`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ published: checked }),
                            })
                            if (!response.ok) {
                              throw new Error('Failed to update published status')
                            }
                            queryClient.invalidateQueries({ queryKey: ['admin-content'] })
                            
                            if (checked) {
                              const publicUrl = getPublicUrl(item)
                              if (publicUrl) {
                                toast.success(
                                  <div className="flex items-center gap-2">
                                    <span>Content published</span>
                                    <a
                                      href={publicUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline font-medium"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      View public page →
                                    </a>
                                  </div>,
                                  { duration: 5000 }
                                )
                              } else {
                                toast.success('Content published')
                              }
                            } else {
                              toast.success('Content unpublished')
                            }
                          } catch (error) {
                            console.error('Failed to update published status:', error)
                            toast.error('Failed to update published status')
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {item.competency?.name || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.published && (() => {
                            const publicUrl = getPublicUrl(item)
                            return publicUrl ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault()
                                  window.open(publicUrl, '_blank', 'noopener,noreferrer')
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-2" />
                                View Public Page
                              </DropdownMenuItem>
                            ) : null
                          })()}
                          <DropdownMenuItem onClick={() => onOpenDetails(item)}>
                            <Eye className="h-3 w-3 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              setContentEditorItem(item)
                              setContentEditorOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {/* Only show "Open in Storage" for articles, not cases */}
                          {item.type === 'article' && item.storagePath && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                setStorageEditorItem(item)
                                setStorageEditorOpen(true)
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Open in Storage
                            </DropdownMenuItem>
                          )}
                          {item.type === 'case' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                // Ensure item.id is a valid string before passing
                                const caseIdStr = item.id && typeof item.id === 'string' ? item.id.trim() : String(item.id || '').trim()
                                if (!caseIdStr || caseIdStr === '[object Object]') {
                                  toast.error('Invalid case ID')
                                  return
                                }
                                setAssetsManagerCaseId(caseIdStr)
                                setAssetsManagerOpen(true)
                              }}
                            >
                              <FileText className="h-3 w-3 mr-2" />
                              View Assets
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              setDeleteItem(item)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-3 border-t bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
            </span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => pagination.onPageChange(1, parseInt(value, 10))}
            >
              <SelectTrigger className="h-7 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs">per page</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Storage Editor Modal */}
      {/* Storage editor only for articles, not cases */}
      {storageEditorItem && storageEditorItem.type === 'article' && storageEditorItem.storagePath && (
        <StorageEditorModal
          open={storageEditorOpen}
          onClose={() => {
            setStorageEditorOpen(false)
            setStorageEditorItem(null)
          }}
          contentType={storageEditorItem.type}
          storagePath={storageEditorItem.storagePath}
        />
      )}

      {/* Assets Manager Modal */}
      <Dialog open={assetsManagerOpen && !!assetsManagerCaseId} onOpenChange={(open) => {
        if (!open) {
          setAssetsManagerOpen(false)
          setAssetsManagerCaseId(null)
        }
      }}>
        {assetsManagerCaseId && (
          <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg">Case Assets</DialogTitle>
                <Button variant="ghost" size="sm" onClick={() => {
                  setAssetsManagerOpen(false)
                  setAssetsManagerCaseId(null)
                }} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <CaseAssetsManager key={assetsManagerCaseId} initialCaseId={assetsManagerCaseId} />
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Content Editor Modal */}
      {contentEditorItem && (
        <ContentEditorModal
          open={contentEditorOpen}
          onClose={() => {
            setContentEditorOpen(false)
            setContentEditorItem(null)
          }}
          contentType={contentEditorItem.type}
          contentId={contentEditorItem.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteItem?.type === 'article' ? 'Article' : 'Case'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteItem?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteItem(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteItem) return
                
                setDeleting(true)
                try {
                  const response = await fetch(`/api/${deleteItem.type === 'article' ? 'articles' : 'cases'}/${deleteItem.id}`, {
                    method: 'DELETE',
                  })
                  
                  if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to delete')
                  }
                  
                  toast.success(`${deleteItem.type === 'article' ? 'Article' : 'Case'} deleted successfully`)
                  queryClient.invalidateQueries({ queryKey: ['admin-content'] })
                  setDeleteDialogOpen(false)
                  setDeleteItem(null)
                } catch (error) {
                  console.error('Failed to delete:', error)
                  toast.error(error instanceof Error ? error.message : 'Failed to delete')
                } finally {
                  setDeleting(false)
                }
              }}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

