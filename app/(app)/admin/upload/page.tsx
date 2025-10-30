'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { syncFileMetadata, uploadToStorage } from '@/lib/supabase/storage'
import { AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react'
import { useState } from 'react'

interface UploadStatus {
  type: 'success' | 'error' | 'loading'
  message: string
}

export default function AdminUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [storagePath, setStoragePath] = useState('')
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null)

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Upload</h1>
        <p className="mt-2 text-gray-600">
          Upload new content files to Supabase Storage
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload New Files</TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  )
}
