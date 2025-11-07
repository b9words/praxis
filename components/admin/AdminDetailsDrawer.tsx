'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Edit, ExternalLink, X, FileText, Briefcase } from 'lucide-react'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { formatDistanceToNow } from 'date-fns'
import StorageEditorModal from '@/components/admin/StorageEditorModal'
import CaseAssetsManager from '@/components/admin/CaseAssetsManager'
import ContentEditorModal from '@/components/admin/ContentEditorModal'

interface ContentItem {
  id: string
  type: 'article' | 'case'
  title: string
  status: string
  updatedAt: Date
  competency?: { name: string }
  storagePath?: string | null
  content?: string
  briefingDoc?: string
  creator?: { username: string }
  updater?: { username: string }
}

interface AdminDetailsDrawerProps {
  item: ContentItem | null
  open: boolean
  onClose: () => void
}

export default function AdminDetailsDrawer({ item, open, onClose }: AdminDetailsDrawerProps) {
  const [fullContent, setFullContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [storageEditorOpen, setStorageEditorOpen] = useState(false)
  const [assetsManagerOpen, setAssetsManagerOpen] = useState(false)
  const [contentEditorOpen, setContentEditorOpen] = useState(false)

  useEffect(() => {
    if (!item || !open) {
      setFullContent(null)
      setStorageEditorOpen(false)
      setAssetsManagerOpen(false)
      setContentEditorOpen(false)
      return
    }

    // Load full content if not already available
    if (item.type === 'article' && !item.content) {
      setLoading(true)
      fetch(`/api/articles/${item.id}`)
        .then((res) => res.json())
        .then((data) => {
          setFullContent(data.article?.content || null)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    } else if (item.type === 'case' && !item.briefingDoc) {
      setLoading(true)
      fetch(`/api/cases/${item.id}`)
        .then((res) => res.json())
        .then((data) => {
          setFullContent(data.case?.briefingDoc || null)
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    } else {
      setFullContent(item.type === 'article' ? item.content || null : item.briefingDoc || null)
    }
  }, [item, open])

  if (!item) return null

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    in_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg">{item.title}</DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {item.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {item.type === 'article' ? 'Article' : 'Case'}
                  </Badge>
                  {item.competency && (
                    <Badge variant="outline" className="text-xs">
                      {item.competency.name}
                    </Badge>
                  )}
                </div>
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Metadata */}
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Last Updated</div>
              <div className="text-sm">
                {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
              </div>
            </div>

            {item.creator && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Created By</div>
                <div className="text-sm">{item.creator.username}</div>
              </div>
            )}

            {item.updater && item.updater.username !== item.creator?.username && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Updated By</div>
                <div className="text-sm">{item.updater.username}</div>
              </div>
            )}

            {/* Only show storage path for articles, not cases */}
            {item.type === 'article' && item.storagePath && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Storage Path</div>
                <div className="text-xs font-mono text-muted-foreground break-all">
                  {item.storagePath}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setContentEditorOpen(true)
              }}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>

            {/* Only show "Open in Storage" for articles, not cases */}
            {item.type === 'article' && item.storagePath && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setStorageEditorOpen(true)
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open in Storage
              </Button>
            )}

            {item.type === 'case' && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setAssetsManagerOpen(true)
                }}
              >
                <FileText className="h-3 w-3 mr-1" />
                View Assets
              </Button>
            )}
          </div>

          <Separator />

          {/* Content Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {item.type === 'article' ? (
                <FileText className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              )}
              <h3 className="text-sm font-semibold">Content Preview</h3>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">Loading content...</div>
            ) : fullContent ? (
              <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-gray-50 max-h-[500px] overflow-y-auto">
                {item.type === 'article' ? (
                  <MarkdownRenderer content={fullContent} />
                ) : (
                  <pre className="whitespace-pre-wrap text-xs font-mono">{fullContent}</pre>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">No content available</div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Storage Editor Modal - only for articles, not cases */}
      {item.type === 'article' && item.storagePath && (
        <StorageEditorModal
          open={storageEditorOpen}
          onClose={() => {
            setStorageEditorOpen(false)
          }}
          contentType={item.type}
          storagePath={item.storagePath}
        />
      )}

      {/* Assets Manager Modal */}
      {item.type === 'case' && (
        <Dialog open={assetsManagerOpen} onOpenChange={setAssetsManagerOpen}>
          <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg">Case Assets: {item.title}</DialogTitle>
                <Button variant="ghost" size="sm" onClick={() => setAssetsManagerOpen(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <CaseAssetsManager 
                initialCaseId={item.id && typeof item.id === 'string' ? item.id : String(item.id || '')} 
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Content Editor Modal */}
      {item && (
        <ContentEditorModal
          open={contentEditorOpen}
          onClose={() => {
            setContentEditorOpen(false)
          }}
          contentType={item.type}
          contentId={item.id}
        />
      )}
    </Dialog>
  )
}

