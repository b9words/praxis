'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ErrorState from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-skeleton'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import RichMarkdownEditor from '@/components/admin/RichMarkdownEditor'
import StructuredJsonEditor from '@/components/admin/StructuredJsonEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase/client'
import { syncMetadata, uploadFileToStorage } from '@/lib/supabase/storage-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileCode, FileText, Save, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface StorageContentEditorProps {
  contentType: 'article' | 'case'
  storagePath: string // e.g., "articles/year1/financial-acumen/lesson1.md"
  onClose?: () => void // Optional callback for modal close
}

export default function StorageContentEditor({ contentType, storagePath, onClose }: StorageContentEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const [content, setContent] = useState('')

  // Fetch file content with React Query
  const { data: storageData, isLoading: loading, error: storageError } = useQuery({
    queryKey: queryKeys.storage.byPath(storagePath),
    queryFn: ({ signal }) =>
      fetchJson<{ success: boolean; content?: string; error?: string }>(
        `/api/storage?path=${encodeURIComponent(storagePath)}`,
        { signal }
      ),
    retry: 2,
  })

  useEffect(() => {
    if (storageData?.success && storageData?.content) {
      setContent(storageData.content)
    }
  }, [storageData])

  // Fetch metadata with React Query
  const { data: metadataData } = useQuery({
    queryKey: [contentType === 'article' ? 'articles' : 'cases', 'metadata', storagePath],
    queryFn: async ({ signal }) => {
      // Try to find by storagePath via API
      const items = contentType === 'article'
        ? await fetchJson<{ articles: any[] }>(`/api/articles?status=all`, { signal })
        : await fetchJson<{ cases: any[] }>(`/api/cases`, { signal })
      
      const itemsTyped = items as any
      const list = contentType === 'article' ? itemsTyped.articles : itemsTyped.cases
      return list?.find((item: any) => item.storagePath === storagePath) || null
    },
    enabled: !!storagePath,
  })

  const metadata = metadataData || null

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (contentToSave: string) => {
      // Create a blob from the content
      const blob = new Blob([contentToSave], { 
        type: contentType === 'article' ? 'text/markdown' : 'application/json' 
      })
      const file = new File([blob], storagePath.split('/').pop() || 'file', {
        type: blob.type
      })

      // Upload to storage
      const uploadResult = await uploadFileToStorage(storagePath, file)
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      // Sync metadata
      const syncResult = await syncMetadata('assets', storagePath)
      if (!syncResult.success) {
        throw new Error(syncResult.error)
      }

      return syncResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage.byPath(storagePath) })
      queryClient.invalidateQueries({ queryKey: [contentType === 'article' ? 'articles' : 'cases', 'metadata', storagePath] })
      queryClient.invalidateQueries({ queryKey: contentType === 'article' ? queryKeys.articles.all() : ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['admin-content'] }) // Also invalidate admin content queries
      toast.success('Content saved successfully')
      // Close modal if onClose callback provided
      if (onClose) {
        setTimeout(() => onClose(), 500)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save content')
    },
  })

  const handleSave = () => {
    saveMutation.mutate(content)
  }

  const saving = saveMutation.isPending

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <LoadingState type="dashboard" />
      </div>
    )
  }

  if (storageError) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Failed to load content"
          message="Unable to load the file content. Please try again."
          error={storageError}
          onRetry={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.storage.byPath(storagePath) })
          }}
          showBackToDashboard={false}
        />
      </div>
    )
  }

  const isMarkdown = contentType === 'article'
  const icon = isMarkdown ? <FileText className="h-5 w-5" /> : <FileCode className="h-5 w-5" />

  return (
    <div className="space-y-4">
      {/* Header - Compact for modal */}
      {!onClose && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit {contentType === 'article' ? 'Article' : 'Case'}
              </h1>
              <p className="text-sm text-gray-600 font-mono">{storagePath}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Action buttons - always visible */}
      <div className="flex gap-2 justify-end pb-2 border-b">
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving || !content}>
          {saving ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save to Storage
            </>
          )}
        </Button>
      </div>

      {/* Metadata Card */}
      {metadata && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-sm">Metadata (Database)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Title</div>
                <div className="font-medium">{metadata.title || '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-medium capitalize">{metadata.status || '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Updated</div>
                <div className="font-medium">
                  {metadata.updated_at ? new Date(metadata.updated_at).toLocaleDateString() : '—'}
                </div>
              </div>
              <div>
                <div className="text-gray-600">ID</div>
                <div className="font-mono text-xs">{metadata.id ? metadata.id.slice(0, 8) : '—'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Content Editor</CardTitle>
          <CardDescription>
            {isMarkdown 
              ? 'Edit the markdown content. Changes will be saved to Supabase Storage and metadata will sync to Postgres.'
              : 'Edit the JSON structure. Ensure valid JSON syntax before saving.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMarkdown ? (
            <RichMarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="# Your Article Title\n\nWrite your content here..."
              minHeight="600px"
              onSave={handleSave}
              showPreview={true}
              autoSave={false}
            />
          ) : (
            <StructuredJsonEditor
              value={content}
              onChange={setContent}
              placeholder='{\n  "title": "...",\n  "description": "...",\n  ...\n}'
              minHeight="500px"
            />
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-sm">💡 Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>• Changes are saved directly to Supabase Storage</p>
          <p>• Metadata is automatically extracted and synced to Postgres</p>
          {isMarkdown ? (
            <>
              <p>• Use frontmatter at the top of markdown files for metadata (title, description, etc.)</p>
              <p>• Preview tab shows how content will render to users</p>
            </>
          ) : (
            <>
              <p>• Ensure JSON is valid before saving to avoid sync errors</p>
              <p>• Case files should include: title, description, briefing, challenges, rubric</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

