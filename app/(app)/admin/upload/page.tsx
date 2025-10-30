'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { syncFileMetadata, uploadToStorage } from '@/lib/supabase/storage'
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'

interface UploadStatus {
  type: 'success' | 'error' | 'loading'
  message: string
}

interface SyncStatus {
  filename: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  message?: string
}

export default function AdminUploadPage() {
  // Tab 1: Upload New Files
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [storagePath, setStoragePath] = useState('')
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null)

  // Tab 2: Sync Existing Files
  const [syncList, setSyncList] = useState<string[]>([])
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadStatus(null)
      
      // Auto-suggest storage path based on filename
      const filename = file.name
      if (filename.endsWith('.md')) {
        setStoragePath(`articles/year1/${filename}`)
      } else if (filename.endsWith('.json')) {
        setStoragePath(`cases/year1/${filename}`)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !storagePath) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file and specify a storage path'
      })
      return
    }

    setUploadStatus({ type: 'loading', message: 'Uploading file...' })

    try {
      // Step 1: Upload to storage
      const uploadResult = await uploadToStorage(storagePath, selectedFile)
      
      if (!uploadResult.success) {
        setUploadStatus({
          type: 'error',
          message: `Upload failed: ${uploadResult.error}`
        })
        return
      }

      // Step 2: Sync metadata
      setUploadStatus({ type: 'loading', message: 'Syncing metadata...' })
      
      const syncResult = await syncFileMetadata('assets', storagePath)
      
      if (!syncResult.success) {
        setUploadStatus({
          type: 'error',
          message: `Metadata sync failed: ${syncResult.error}`
        })
        return
      }

      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded and synced: ${selectedFile.name}`
      })
      
      // Reset form
      setSelectedFile(null)
      setStoragePath('')
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const handleAddToSyncList = () => {
    const input = document.getElementById('sync-path-input') as HTMLInputElement
    const path = input?.value?.trim()
    
    if (path && !syncList.includes(path)) {
      setSyncList([...syncList, path])
      input.value = ''
    }
  }

  const handleRemoveFromSyncList = (path: string) => {
    setSyncList(syncList.filter(p => p !== path))
  }

  const handleBatchSync = async () => {
    if (syncList.length === 0) return

    setIsSyncing(true)
    const statuses: SyncStatus[] = syncList.map(path => ({
      filename: path,
      status: 'pending'
    }))
    setSyncStatuses(statuses)

    // Process files sequentially
    for (let i = 0; i < syncList.length; i++) {
      const path = syncList[i]
      
      // Update status to uploading
      statuses[i].status = 'uploading'
      setSyncStatuses([...statuses])

      try {
        // For this demo, we'll assume files need to be uploaded first
        // In a real scenario, you'd read from local filesystem via an API route
        const response = await fetch('/api/sync-local-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
        })

        if (!response.ok) {
          throw new Error('Failed to sync file')
        }

        statuses[i].status = 'success'
        statuses[i].message = 'Synced successfully'
      } catch (error) {
        statuses[i].status = 'error'
        statuses[i].message = error instanceof Error ? error.message : 'Unknown error'
      }
      
      setSyncStatuses([...statuses])
    }

    setIsSyncing(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Upload & Sync</h1>
        <p className="mt-2 text-gray-600">
          Upload new content files or sync existing files from the content directory
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload New Files</TabsTrigger>
          <TabsTrigger value="sync">Sync Existing Files</TabsTrigger>
        </TabsList>

        {/* Tab 1: Upload New Files */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Content File</CardTitle>
              <CardDescription>
                Upload a markdown article (.md) or case simulation (.json) file to Supabase Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".md,.json"
                  onChange={handleFileSelect}
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
                />
                <p className="text-xs text-gray-500">
                  Examples: articles/year1/financial-acumen/reading-statements.md or cases/year1/unit-economics.json
                </p>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !storagePath || uploadStatus?.type === 'loading'}
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
                  className={`flex items-start gap-2 p-3 rounded-md ${
                    uploadStatus.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Sync Existing Files */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Existing Files</CardTitle>
              <CardDescription>
                Batch sync files from your local content directory to Supabase Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sync-path-input">Add File Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="sync-path-input"
                    type="text"
                    placeholder="content/curriculum/domain/module/lesson.md"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddToSyncList()
                      }
                    }}
                  />
                  <Button onClick={handleAddToSyncList} variant="outline">
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Add local file paths to sync (relative to project root)
                </p>
              </div>

              {syncList.length > 0 && (
                <div className="space-y-2">
                  <Label>Files to Sync ({syncList.length})</Label>
                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                    {syncList.map((path) => (
                      <div key={path} className="flex items-center justify-between p-2 hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-mono">{path}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromSyncList(path)}
                          disabled={isSyncing}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syncStatuses.length > 0 && (
                <div className="space-y-2">
                  <Label>Sync Progress</Label>
                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                    {syncStatuses.map((status) => (
                      <div key={status.filename} className="flex items-center justify-between p-2">
                        <span className="text-sm font-mono flex-1">{status.filename}</span>
                        <Badge
                          variant={
                            status.status === 'success'
                              ? 'default'
                              : status.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {status.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleBatchSync}
                disabled={syncList.length === 0 || isSyncing}
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Sync {syncList.length} File{syncList.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>

              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Batch sync requires a server-side API route to read local files.
                  Create an API route at /api/sync-local-file to enable this feature.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

