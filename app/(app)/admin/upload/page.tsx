'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchJson } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface UploadStatus {
  type: 'success' | 'error' | 'loading'
  message: string
}

export default function AdminUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [storagePath, setStoragePath] = useState('')

  const uploadMutation = useMutation({
    mutationFn: async ({ file, path }: { file: File; path: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', path)

      return fetchJson<{ success: boolean; path?: string; error?: string }>('/api/storage/upload', {
        method: 'POST',
        body: formData as any, // FormData needs special handling
      })
    },
    onSuccess: async (data, variables) => {
      // Step 2: Sync metadata
      await syncMutation.mutateAsync({
        bucket: 'assets',
        path: variables.path,
      })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    },
  })

  const syncMutation = useMutation({
    mutationFn: ({ bucket, path }: { bucket: string; path: string }) =>
      fetchJson('/api/storage/sync', {
        method: 'POST',
        body: { bucket, path },
      }),
    onSuccess: () => {
      toast.success(`Successfully uploaded and synced: ${selectedFile?.name}`)
      // Reset form
      setSelectedFile(null)
      setStoragePath('')
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Metadata sync failed')
    },
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Auto-suggest storage path based on filename
      const filename = file.name
      if (filename.endsWith('.md')) {
        setStoragePath(`articles/year1/${filename}`)
      } else if (filename.endsWith('.json')) {
        setStoragePath(`cases/year1/${filename}`)
      }
    }
  }

  const handleUpload = () => {
    if (!selectedFile || !storagePath) {
      toast.error('Please select a file and specify a storage path')
      return
    }

    uploadMutation.mutate({ file: selectedFile, path: storagePath })
  }

  const uploadStatus = uploadMutation.isPending || syncMutation.isPending
    ? { type: 'loading' as const, message: uploadMutation.isPending ? 'Uploading file...' : 'Syncing metadata...' }
    : uploadMutation.isError || syncMutation.isError
    ? { type: 'error' as const, message: uploadMutation.error?.message || syncMutation.error?.message || 'Unknown error' }
    : syncMutation.isSuccess
    ? { type: 'success' as const, message: `Successfully uploaded and synced: ${selectedFile?.name}` }
    : null

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Content Upload</h1>
        <p className="text-sm text-gray-600">
          Upload new content files to Supabase Storage
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload New Files</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div className="bg-white border border-gray-200">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Upload Content File</h2>
              <p className="text-xs text-gray-500 mt-1">
                Upload a markdown article (.md) or case simulation (.json) file to Supabase Storage
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".md,.json"
                  onChange={handleFileSelect}
                  className="rounded-none"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage-path">Storage Path</Label>
                <Input
                  id="storage-path"
                  type="text"
                  placeholder="articles/year1/domain/module/lesson.md"
                  value={storagePath}
                  onChange={(e) => setStoragePath(e.target.value)}
                  className="rounded-none"
                />
                <p className="text-xs text-gray-500">
                  Examples: articles/year1/financial-acumen/reading-statements.md or cases/year1/unit-economics.json
                </p>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !storagePath || uploadStatus?.type === 'loading'}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-none"
              >
                {uploadStatus?.type === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadStatus.message}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Sync
                  </>
                )}
              </Button>

              {uploadStatus && uploadStatus.type !== 'loading' && (
                <div
                  className={`flex items-start gap-2 p-3 border ${
                    uploadStatus.type === 'success'
                      ? 'bg-gray-50 border-gray-200 text-gray-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                  )}
                  <p className="text-sm">{uploadStatus.message}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
