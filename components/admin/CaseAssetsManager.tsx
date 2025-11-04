'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, RefreshCw, FileText, ExternalLink, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Asset {
  fileId: string
  fileName: string
  fileType: string
  sourceType: string
  exists: boolean
  filePath: string | null
  fileSize: number | null
  canRegenerate: boolean
  preview?: string | null
}

interface AssetsResponse {
  caseId: string
  caseTitle: string
  assets: Asset[]
  totalAssets: number
  existingAssets: number
  caseContent?: {
    description: string
    stages: any[]
    rubric: any
    competencies: string[]
    estimatedDuration: number
    difficulty: string
    hasStages: boolean
    hasRubric: boolean
  }
}

export default function CaseAssetsManager() {
  const [caseId, setCaseId] = useState('')
  const [assets, setAssets] = useState<AssetsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<{ fileId: string; content: string; fileName: string } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null)

  // Listen for case generation events
  useEffect(() => {
    const handleCaseGenerated = (event: CustomEvent<{ caseId: string }>) => {
      setCaseId(event.detail.caseId)
      // Auto-load assets after a short delay
      setTimeout(() => {
        loadAssets(event.detail.caseId)
      }, 1000)
    }

    window.addEventListener('case-generated', handleCaseGenerated as EventListener)
    return () => {
      window.removeEventListener('case-generated', handleCaseGenerated as EventListener)
    }
  }, [])

  async function loadAssets(id?: string) {
    const targetCaseId = id || caseId
    if (!targetCaseId.trim()) {
      setError('Please enter a case ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/case-generation/list-assets?caseId=${encodeURIComponent(targetCaseId)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load assets')
      }
      const data: AssetsResponse = await response.json()
      setAssets(data)
      setCaseId(targetCaseId) // Update caseId in state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assets'
      setError(errorMessage)
      setAssets(null)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function regenerateAsset(fileId: string) {
    setGenerating(fileId)
    setError(null)

    try {
      const response = await fetch('/api/case-generation/generate-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          fileId,
          overwrite: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Generation failed')
      }

      // Reload assets
      await loadAssets()
      toast.success('Asset regenerated successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setGenerating(null)
    }
  }

  async function loadPreview(asset: Asset) {
    if (!asset.filePath) return
    
    setLoadingPreview(true)
    setPreviewAsset(null)
    try {
      const relativePath = asset.filePath.replace(/^content\/sources\//, '')
      const apiUrl = `/api/case-content/${relativePath.split('/').map(encodeURIComponent).join('/')}`
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const content = await response.text()
        setPreviewAsset({
          fileId: asset.fileId,
          content,
          fileName: asset.fileName
        })
      } else {
        toast.error('Failed to load preview')
      }
    } catch (err) {
      toast.error('Failed to load preview')
    } finally {
      setLoadingPreview(false)
    }
  }
  
  function openPreview(asset: Asset) {
    setPreviewAssetId(asset.fileId)
    setPreviewOpen(true)
    loadPreview(asset)
  }
  
  function openSourceFile(filePath: string | null) {
    if (!filePath) return
    
    // Remove content/sources/ prefix if present
    const relativePath = filePath.replace(/^content\/sources\//, '')
    const apiUrl = `/api/case-content/${relativePath.split('/').map(encodeURIComponent).join('/')}`
    window.open(apiUrl, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Assets Manager</CardTitle>
        <CardDescription>List and regenerate case file assets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter case ID (e.g., cs_arena_1_1_two_pizza_reorg)"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadAssets()
            }}
          />
          <Button onClick={loadAssets} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Load
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {assets && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h4 className="font-semibold text-lg">{assets.caseTitle}</h4>
                <p className="text-sm text-muted-foreground mt-1">Case ID: {assets.caseId}</p>
                {assets.caseContent && (
                  <div className="flex gap-2 mt-2">
                    {assets.caseContent.hasStages && (
                      <Badge variant="outline" className="text-xs">
                        {assets.caseContent.stages.length} stages
                      </Badge>
                    )}
                    {assets.caseContent.hasRubric && (
                      <Badge variant="outline" className="text-xs">
                        Rubric
                      </Badge>
                    )}
                    {assets.caseContent.competencies.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {assets.caseContent.competencies.length} competencies
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Badge variant={assets.existingAssets === assets.totalAssets ? "default" : "secondary"}>
                {assets.existingAssets} / {assets.totalAssets} assets
              </Badge>
            </div>
            
            {assets.caseContent && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Case Content Status</h5>
                <div className="space-y-1 text-sm">
                  {assets.caseContent.description && (
                    <p className="text-gray-700 line-clamp-2">{assets.caseContent.description}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-600">
                    {assets.caseContent.hasStages ? (
                      <span className="text-green-700">✓ {assets.caseContent.stages.length} stages</span>
                    ) : (
                      <span className="text-red-700">⚠ No stages</span>
                    )}
                    {assets.caseContent.hasRubric ? (
                      <span className="text-green-700">✓ Rubric</span>
                    ) : (
                      <span className="text-red-700">⚠ No rubric</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Shared Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {assets.assets.find(a => a.fileId === previewAssetId)?.fileName || 'Preview'}
                  </DialogTitle>
                  <DialogDescription>
                    {previewAssetId && (() => {
                      const asset = assets.assets.find(a => a.fileId === previewAssetId)
                      return asset ? `${asset.fileType} • ${asset.sourceType}` : ''
                    })()}
                  </DialogDescription>
                </DialogHeader>
                {loadingPreview ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : previewAsset && previewAsset.fileId === previewAssetId ? (
                  <div className="mt-4">
                    {previewAssetId && (() => {
                      const asset = assets.assets.find(a => a.fileId === previewAssetId)
                      const isCSV = asset && (asset.fileType === 'FINANCIAL_DATA' || asset.fileName.endsWith('.csv'))
                      return isCSV ? (
                        <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-4 rounded border overflow-x-auto max-h-[60vh] overflow-y-auto">
                          {previewAsset.content}
                        </pre>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border max-h-[60vh] overflow-y-auto">
                            {previewAsset.content}
                          </pre>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    Loading...
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {assets.assets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No assets found for this case</p>
                </div>
              ) : (
                assets.assets.map((asset) => (
                  <div
                    key={asset.fileId}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      asset.exists ? 'bg-green-50/50 border-green-200' : 'bg-orange-50/50 border-orange-200'
                    }`}
                  >
                    {/* Header with file info and actions */}
                    <div className="flex items-start justify-between p-3 border-b bg-white/50">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {asset.exists ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{asset.fileName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {asset.fileType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {asset.sourceType}
                            </Badge>
                            {asset.fileSize && (
                              <span className="text-xs text-muted-foreground">
                                {(asset.fileSize / 1024).toFixed(1)} KB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {asset.exists && asset.filePath && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSourceFile(asset.filePath)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                        )}
                        {asset.canRegenerate && (
                          <Button
                            variant={asset.exists ? "default" : "default"}
                            size="sm"
                            onClick={() => regenerateAsset(asset.fileId)}
                            disabled={generating === asset.fileId}
                          >
                            {generating === asset.fileId ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-1 h-3 w-3" />
                                {asset.exists ? 'Regenerate' : 'Generate'}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* INLINE PREVIEW - Always visible if preview exists */}
                    {asset.exists && asset.preview ? (
                      <div className="p-3 bg-white border-t">
                        <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Preview</div>
                        {asset.fileType === 'FINANCIAL_DATA' || asset.fileName.endsWith('.csv') ? (
                          <pre className="text-xs font-mono bg-gray-50 p-3 rounded border overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                            {asset.preview}
                          </pre>
                        ) : asset.fileName.endsWith('.json') ? (
                          <pre className="text-xs font-mono bg-gray-50 p-3 rounded border overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                            {asset.preview}
                          </pre>
                        ) : (
                          <div className="text-sm bg-gray-50 p-3 rounded border max-h-[300px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-sans">{asset.preview}</pre>
                          </div>
                        )}
                      </div>
                    ) : asset.exists && !asset.preview ? (
                      <div className="p-3 bg-white border-t text-xs text-gray-400 italic">
                        Preview not available
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

