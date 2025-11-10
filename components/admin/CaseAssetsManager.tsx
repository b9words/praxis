'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown } from 'lucide-react'
import { Loader2, RefreshCw, FileText, ExternalLink, CheckCircle, AlertCircle, Eye, Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import StructuredJsonEditor from './StructuredJsonEditor'
import { Textarea } from '@/components/ui/textarea'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import AssetRenderer from './renderers/AssetRenderer'

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
  mimeType?: string | null
  truncated?: boolean
  previewReason?: string
  validationErrors?: string[]
  warnings?: string[]
  lastGeneration?: {
    model?: string
    timestamp?: string
    validationErrors?: string[]
  }
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

interface CaseAssetsManagerProps {
  initialCaseId?: string | null
}

import { normalizeCaseId, validateCaseId } from '@/lib/case-id'

export default function CaseAssetsManager({ 
  initialCaseId
}: CaseAssetsManagerProps = {}) {
  // Normalize initialCaseId immediately
  const normalizedInitialCaseId = normalizeCaseId(initialCaseId)
  const [caseId, setCaseId] = useState(normalizedInitialCaseId || '')
  const [assets, setAssets] = useState<AssetsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<{ fileId: string; content: string; fileName: string; validationErrors?: string[] } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null)
  const [previewTab, setPreviewTab] = useState<'preview' | 'raw'>('preview')
  const [expandedValidationErrors, setExpandedValidationErrors] = useState<Record<string, boolean>>({})
  const [lastApiResponse, setLastApiResponse] = useState<{ endpoint: string; status: number; data: any } | null>(null)
  const [healthCheck, setHealthCheck] = useState<any>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(process.env.NODE_ENV === 'development')
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_ASSETS === 'true'
  
  // Editing state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null)
  const [inlineEditingContent, setInlineEditingContent] = useState<string>('')
  const [modalEditingId, setModalEditingId] = useState<string | null>(null)
  const [modalEditingContent, setModalEditingContent] = useState<string>('')
  const [saving, setSaving] = useState<string | null>(null)

  // Auto-load if initialCaseId provided - ALWAYS load when initialCaseId changes or when component mounts with a valid ID
  useEffect(() => {
    const newNormalizedId = normalizeCaseId(initialCaseId)
    
    // If we have a valid caseId, always ensure it's loaded
    if (newNormalizedId) {
      const caseIdChanged = newNormalizedId !== caseId
      
      // Update caseId state if different
      if (caseIdChanged) {
        setCaseId(newNormalizedId)
        // Clear assets when switching to a different case
        setAssets(null)
        setError(null)
      }
      
      // Always load assets if:
      // 1. caseId changed (different case) - always reload
      // 2. We don't have assets yet (first load or after clearing)
      // 3. We're not currently loading (avoid duplicate requests)
      if (caseIdChanged || (!assets && !loading)) {
        // Always load from database to ensure consistency
        loadAssets(newNormalizedId).catch((err) => {
          console.error('[CaseAssetsManager] Auto-load failed:', err)
          setError(err instanceof Error ? err.message : 'Failed to load assets')
        })
      }
    } else if (initialCaseId === null || initialCaseId === undefined) {
      // If initialCaseId is explicitly null/undefined, clear assets
      setAssets(null)
      setError(null)
      setCaseId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCaseId])

  async function loadAssets(id?: string) {
    // Normalize and validate the caseId
    const rawId = id || caseId
    const validation = validateCaseId(rawId)
    
    if (!validation.valid) {
      const errorMsg = validation.error || 'Invalid case ID. Please provide a valid case ID.'
      setError(errorMsg)
      setLastApiResponse({ endpoint: 'list-assets', status: 400, data: { error: errorMsg } })
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CaseAssetsManager] loadAssets called with invalid ID:', rawId, validation.error)
      }
      return
    }
    
    const targetCaseId = validation.caseId!

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/case-generation/list-assets?caseId=${encodeURIComponent(targetCaseId)}`)
      if (!response.ok) {
        const errorData = await response.json()
        // If table missing error, check if we have a warning with fallback data
        if (errorData.warning && errorData.assets) {
          // Use the fallback data from the API (empty assets list with warning)
          setAssets({
            caseId: targetCaseId,
            caseTitle: errorData.caseTitle || 'Untitled Case',
            assets: errorData.assets || [],
            totalAssets: errorData.totalAssets || 0,
            existingAssets: errorData.existingAssets || 0,
          })
          setCaseId(targetCaseId)
          // Show warning toast instead of error
          toast.warning(errorData.warning)
          return
        }
        throw new Error(errorData.error || 'Failed to load assets')
      }
      const data: AssetsResponse = await response.json()
      setLastApiResponse({ endpoint: 'list-assets', status: response.status, data })
      setAssets(data)
      setCaseId(targetCaseId) // Update caseId in state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load assets'
      setLastApiResponse({ endpoint: 'list-assets', status: 0, data: { error: errorMessage, stack: err instanceof Error ? err.stack : undefined } })
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
        headers: { 
          'Content-Type': 'application/json',
          'x-debug': debugMode ? 'true' : 'false',
        },
        body: JSON.stringify({
          caseId,
          fileId,
          overwrite: true,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        const errorDetails = responseData.details || responseData.validationErrors || []
        const errorMsg = responseData.error || 'Generation failed'
        const fullError = errorDetails.length > 0 
          ? `${errorMsg}: ${Array.isArray(errorDetails) ? errorDetails.join('; ') : errorDetails}`
          : errorMsg
        throw new Error(fullError)
      }

      // Check for validation warnings
      const validationErrors = responseData.validationErrors || responseData.warnings || []
      if (validationErrors.length > 0) {
        toast.warning(`Asset generated with ${validationErrors.length} validation warning(s)`, {
          description: validationErrors.slice(0, 2).join(', '),
          duration: 5000,
        })
      } else {
        toast.success('Asset regenerated successfully!')
      }

      // Update local asset state with validationErrors before reloading
      if (assets && validationErrors.length > 0) {
        setAssets(prev => {
          if (!prev) return prev
          return {
            ...prev,
            assets: prev.assets.map(a => 
              a.fileId === fileId 
                ? { ...a, validationErrors, warnings: validationErrors }
                : a
            )
          }
        })
      }

      // Reload assets to get updated content
      await loadAssets()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed'
      setError(errorMessage)
      toast.error(errorMessage, { duration: 7000 })
    } finally {
      setGenerating(null)
    }
  }

  async function loadPreview(asset: Asset) {
    if (!caseId) return
    
    setLoadingPreview(true)
    setPreviewAsset(null)
    try {
      // For JSON files, always fetch full content (preview is truncated and breaks JSON)
      const isJSON = asset.fileName.toLowerCase().endsWith('.json') || 
                     asset.fileType === 'ORG_CHART' || 
                     asset.fileType === 'STAKEHOLDER_PROFILES' || 
                     asset.fileType === 'MARKET_DATASET' ||
                     (asset.preview && (asset.preview.trim().startsWith('{') || asset.preview.trim().startsWith('[')))
      
      // For non-JSON files, use preview if available and not truncated
      if (!isJSON && asset.preview && !asset.preview.includes('... (truncated)')) {
        setPreviewAsset({
          fileId: asset.fileId,
          content: asset.preview,
          fileName: asset.fileName
        })
        setLoadingPreview(false)
        return
      }

      // For JSON files or when preview is truncated, always fetch full content
      const apiUrl = `/api/case-generation/get-asset?caseId=${encodeURIComponent(caseId)}&fileId=${encodeURIComponent(asset.fileId)}`
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        let content: string
        
        // Check if response is JSON (error) or text (content)
        if (contentType.includes('application/json')) {
          const errorData = await response.json()
          const errorMsg = errorData.error || errorData.details || 'Unknown error'
          throw new Error(errorMsg)
        } else {
          content = await response.text()
        }
        
        setPreviewAsset({
          fileId: asset.fileId,
          content,
          fileName: asset.fileName,
          validationErrors: asset.validationErrors,
        })
        setLastApiResponse({ endpoint: 'get-asset', status: response.status, data: { contentLength: content.length } })
      } else {
        // Try to get error details from JSON response
        let errorDetails = 'Failed to load preview'
        try {
          const errorData = await response.json()
          errorDetails = errorData.error || errorData.details || errorDetails
          setLastApiResponse({ endpoint: 'get-asset', status: response.status, data: errorData })
        } catch {
          // Not JSON, use status text
          errorDetails = response.statusText || errorDetails
          setLastApiResponse({ endpoint: 'get-asset', status: response.status, data: { error: errorDetails } })
        }
        
        // Fallback to preview if fetch fails
        if (asset.preview) {
          setPreviewAsset({
            fileId: asset.fileId,
            content: asset.preview,
            fileName: asset.fileName,
            validationErrors: asset.validationErrors,
          })
          toast.warning(`Using cached preview. Full content unavailable: ${errorDetails}`)
        } else {
          toast.error(`Failed to load preview: ${errorDetails}`)
        }
      }
    } catch (err) {
      // Fallback to preview if fetch fails
      if (asset.preview) {
        setPreviewAsset({
          fileId: asset.fileId,
          content: asset.preview,
          fileName: asset.fileName,
          validationErrors: asset.validationErrors,
        })
        toast.warning('Using cached preview. Full content fetch failed.')
      } else {
        toast.error('Failed to load preview: ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
    } finally {
      setLoadingPreview(false)
    }
  }
  
  function openPreview(asset: Asset) {
    setPreviewAssetId(asset.fileId)
    setPreviewOpen(true)
    loadPreview(asset)
  }
  
  function openSourceFile(fileIdOrPath: string | null) {
    if (!caseId || !fileIdOrPath) return
    
    // Use DB-backed endpoint - fileIdOrPath is now the fileId
    const asset = assets?.assets.find(a => a.fileId === fileIdOrPath)
    if (asset) {
      const apiUrl = `/api/case-generation/get-asset?caseId=${encodeURIComponent(caseId)}&fileId=${encodeURIComponent(asset.fileId)}`
      window.open(apiUrl, '_blank')
    }
  }

  async function loadFullContent(asset: Asset): Promise<string> {
    if (!caseId) {
      throw new Error('Case ID not available')
    }
    
    // Try preview first (might be truncated)
    if (asset.preview && !asset.preview.includes('... (truncated)')) {
      return asset.preview
    }
    
    try {
      // Fetch full content from DB
      const apiUrl = `/api/case-generation/get-asset?caseId=${encodeURIComponent(caseId)}&fileId=${encodeURIComponent(asset.fileId)}`
      const response = await fetch(apiUrl)
      
      if (response.ok) {
        return await response.text()
      }
      throw new Error('Failed to load content')
    } catch (err) {
      // Fallback to preview if available
      if (asset.preview) {
        return asset.preview
      }
      throw err
    }
  }

  async function startInlineEdit(asset: Asset) {
    try {
      const content = await loadFullContent(asset)
      setInlineEditingId(asset.fileId)
      setInlineEditingContent(content)
    } catch (err) {
      toast.error('Failed to load content for editing')
    }
  }

  function cancelInlineEdit() {
    setInlineEditingId(null)
    setInlineEditingContent('')
  }

  async function saveInlineEdit(asset: Asset) {
    if (!inlineEditingContent.trim()) {
      toast.error('Content cannot be empty')
      return
    }

    // Client-side validation for JSON files
    if (asset.fileName.endsWith('.json')) {
      try {
        JSON.parse(inlineEditingContent)
      } catch (e) {
        toast.error('Invalid JSON format. Please fix the syntax errors before saving.', {
          description: e instanceof Error ? e.message : 'JSON parse error',
        })
        return
      }
    }

    setSaving(asset.fileId)
    try {
      const response = await fetch('/api/case-generation/update-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          fileId: asset.fileId,
          content: inlineEditingContent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      // Reload assets
      await loadAssets()
      setInlineEditingId(null)
      setInlineEditingContent('')
      toast.success('Asset saved successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save'
      toast.error(errorMessage)
    } finally {
      setSaving(null)
    }
  }

  async function startModalEdit(asset: Asset) {
    try {
      const content = await loadFullContent(asset)
      setModalEditingId(asset.fileId)
      setModalEditingContent(content)
    } catch (err) {
      toast.error('Failed to load content for editing')
    }
  }

  function closeModalEdit() {
    setModalEditingId(null)
    setModalEditingContent('')
  }

  async function saveModalEdit(asset: Asset) {
    if (!modalEditingContent.trim()) {
      toast.error('Content cannot be empty')
      return
    }

    // Client-side validation for JSON files
    if (asset.fileName.endsWith('.json')) {
      try {
        JSON.parse(modalEditingContent)
      } catch (e) {
        toast.error('Invalid JSON format. Please fix the syntax errors before saving.', {
          description: e instanceof Error ? e.message : 'JSON parse error',
        })
        return
      }
    }

    setSaving(asset.fileId)
    try {
      const response = await fetch('/api/case-generation/update-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          fileId: asset.fileId,
          content: modalEditingContent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      // Reload assets
      await loadAssets()
      closeModalEdit()
      toast.success('Asset saved successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save'
      toast.error(errorMessage)
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Case Assets Manager</CardTitle>
        <CardDescription>
          {normalizedInitialCaseId 
            ? `Assets for case: ${normalizedInitialCaseId}` 
            : 'List and regenerate case file assets'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 min-h-0 overflow-y-auto">
        {/* Only show manual input if no initialCaseId provided */}
        {!normalizedInitialCaseId && (
          <div className="flex gap-2">
            <Input
              placeholder="Enter case ID (e.g., cs_arena_1_1_two_pizza_reorg)"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadAssets()
              }}
            />
            <Button onClick={() => loadAssets()} disabled={loading}>
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
        )}
        
        {/* Show case ID display if initialCaseId provided */}
        {normalizedInitialCaseId && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <span className="font-medium">Case ID:</span> {normalizedInitialCaseId}
            {loading && <span className="ml-2 text-blue-600">Loading assets...</span>}
          </div>
        )}

        {/* Diagnostics Panel (Dev Only) */}
        {showDiagnostics && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Diagnostics</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiagnostics(false)}
                className="h-6 px-2"
              >
                Hide
              </Button>
            </div>
            <div className="space-y-1">
              <div><span className="font-medium">Case ID:</span> {caseId || '(none)'}</div>
              <div><span className="font-medium">Loading:</span> {loading ? 'Yes' : 'No'}</div>
              <div><span className="font-medium">Assets Count:</span> {assets?.totalAssets ?? 0}</div>
              <div><span className="font-medium">Existing Assets:</span> {assets?.existingAssets ?? 0}</div>
              {lastApiResponse && (
                <div>
                  <span className="font-medium">Last API:</span> {lastApiResponse.endpoint} - Status: {lastApiResponse.status}
                </div>
              )}
            </div>
            {assets && assets.assets.length === 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                <div className="font-semibold mb-1">⚠️ No Assets Found</div>
                <div className="text-xs">
                  {!caseId && 'No case ID provided. '}
                  {caseId && !error && 'Case exists but has no files. Try generating assets. '}
                  {error && `Error: ${error}`}
                </div>
              </div>
            )}
            {lastApiResponse && (
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Last API Response (first 2KB)</summary>
                <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(lastApiResponse.data, null, 2).substring(0, 2000)}
                </pre>
              </details>
            )}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const url = caseId ? `/api/case-generation/health?caseId=${encodeURIComponent(caseId)}` : '/api/case-generation/health'
                    const res = await fetch(url)
                    const data = await res.json()
                    setHealthCheck({ status: res.status, data })
                  } catch (err) {
                    setHealthCheck({ status: 0, data: { error: err instanceof Error ? err.message : 'Unknown error' } })
                  }
                }}
                className="text-xs"
              >
                Check Health
              </Button>
              {healthCheck && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Health Check Result</summary>
                  <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(healthCheck, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {!showDiagnostics && process.env.NODE_ENV === 'development' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiagnostics(true)}
            className="text-xs"
          >
            Show Diagnostics
          </Button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <div className="font-medium mb-1">Error loading assets:</div>
            <div>{error}</div>
            {normalizedInitialCaseId && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => loadAssets(normalizedInitialCaseId)}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            )}
          </div>
        )}

        {loading && normalizedInitialCaseId && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Loading assets...</span>
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
              <div className="flex items-center gap-3">
                <Badge variant={assets.existingAssets === assets.totalAssets ? "default" : "secondary"}>
                  {assets.existingAssets} / {assets.totalAssets} assets
                </Badge>
              </div>
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

            {/* Modal Editor Dialog */}
            <Dialog open={modalEditingId !== null} onOpenChange={(open) => !open && closeModalEdit()}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle>
                        {modalEditingId && assets.assets.find(a => a.fileId === modalEditingId)?.fileName || 'Edit Asset'}
                      </DialogTitle>
                      <DialogDescription>
                        {modalEditingId && (() => {
                          const asset = assets.assets.find(a => a.fileId === modalEditingId)
                          return asset ? `${asset.fileType} • ${asset.sourceType}` : ''
                        })()}
                      </DialogDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={closeModalEdit} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>
                {modalEditingId && (() => {
                  const asset = assets.assets.find(a => a.fileId === modalEditingId)
                  if (!asset) return null
                  
                  return (
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {asset.fileName.endsWith('.json') ? (
                        <StructuredJsonEditor
                          value={modalEditingContent}
                          onChange={setModalEditingContent}
                          minHeight="600px"
                        />
                      ) : (
                        <Textarea
                          value={modalEditingContent}
                          onChange={(e) => setModalEditingContent(e.target.value)}
                          className="font-mono text-sm min-h-[600px] w-full"
                          placeholder="Enter content..."
                        />
                      )}
                      <div className="flex gap-2 mt-4 justify-end">
                        <Button
                          variant="outline"
                          onClick={closeModalEdit}
                          disabled={saving === asset.fileId}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => saveModalEdit(asset)}
                          disabled={saving === asset.fileId}
                        >
                          {saving === asset.fileId ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </DialogContent>
            </Dialog>

            {/* Shared Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={(open) => {
              setPreviewOpen(open)
              if (!open) {
                setPreviewTab('preview')
              }
            }}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
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
                  <div className="flex items-center justify-center py-8 flex-1">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : previewAsset && previewAsset.fileId === previewAssetId ? (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Validation Errors */}
                    {previewAsset.validationErrors && previewAsset.validationErrors.length > 0 && (
                      <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-900 mb-1">
                              {previewAsset.validationErrors.length} Validation Warning{previewAsset.validationErrors.length > 1 ? 's' : ''}
                            </p>
                            <ul className="space-y-1 text-xs text-yellow-800">
                              {previewAsset.validationErrors.map((err, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-yellow-600 mt-0.5">•</span>
                                  <span>{err}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Tabs for Preview/Raw Content */}
                    <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'preview' | 'raw')} className="flex-1 flex flex-col overflow-hidden">
                      <div className="px-6 pt-4 border-b flex-shrink-0">
                        <TabsList>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                          {(debugMode || previewAsset.validationErrors) && (
                            <TabsTrigger value="raw">Raw Content</TabsTrigger>
                          )}
                        </TabsList>
                      </div>
                      
                      <TabsContent value="preview" className="flex-1 overflow-y-auto px-6 py-4 m-0">
                        {previewAssetId && (() => {
                          const asset = assets.assets.find(a => a.fileId === previewAssetId)
                          if (!asset) return null
                          
                          return (
                            <AssetRenderer
                              content={previewAsset.content}
                              fileType={asset.fileType}
                              fileName={asset.fileName}
                              mimeType={asset.mimeType}
                            />
                          )
                        })()}
                      </TabsContent>
                      
                      {(debugMode || previewAsset.validationErrors) && (
                        <TabsContent value="raw" className="flex-1 overflow-y-auto px-6 py-4 m-0">
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                              {previewAsset.content.substring(0, 1000)}
                              {previewAsset.content.length > 1000 && '\n\n... (truncated, showing first 1000 chars)'}
                            </pre>
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground flex-1">
                    Loading...
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
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
                        {asset.exists && (
                          <>
                            {inlineEditingId !== asset.fileId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startInlineEdit(asset)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Quick Edit
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startModalEdit(asset)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Full Editor
                            </Button>
                          </>
                        )}
                        {asset.exists && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSourceFile(asset.fileId)}
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
                    
                    {/* INLINE EDITING - Show editor when in edit mode */}
                    {inlineEditingId === asset.fileId ? (
                      <div className="p-3 bg-white border-t">
                        <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Editing</div>
                        {asset.fileName.endsWith('.json') ? (
                          <div className="mb-3">
                            <StructuredJsonEditor
                              value={inlineEditingContent}
                              onChange={setInlineEditingContent}
                              minHeight="400px"
                            />
                          </div>
                        ) : (
                          <Textarea
                            value={inlineEditingContent}
                            onChange={(e) => setInlineEditingContent(e.target.value)}
                            className="font-mono text-sm min-h-[400px]"
                            placeholder="Enter content..."
                          />
                        )}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => saveInlineEdit(asset)}
                            disabled={saving === asset.fileId}
                          >
                            {saving === asset.fileId ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-1 h-3 w-3" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelInlineEdit}
                            disabled={saving === asset.fileId}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* INLINE PREVIEW - Always visible if preview exists */
                      asset.exists && asset.preview ? (
                        <div className="p-3 bg-white border-t">
                          {/* Validation Errors Banner */}
                          {(asset.validationErrors && asset.validationErrors.length > 0) && (
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <button
                                onClick={() => setExpandedValidationErrors(prev => ({
                                  ...prev,
                                  [asset.fileId]: !prev[asset.fileId]
                                }))}
                                className="flex items-center justify-between w-full text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm font-semibold text-yellow-900">
                                    {asset.validationErrors.length} Validation Warning{asset.validationErrors.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <ChevronDown className={`h-4 w-4 text-yellow-600 transition-transform ${expandedValidationErrors[asset.fileId] ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedValidationErrors[asset.fileId] && (
                                <ul className="mt-2 space-y-1 text-xs text-yellow-800">
                                  {asset.validationErrors.map((err, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-yellow-600 mt-0.5">•</span>
                                      <span>{err}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Preview</div>
                          <div className="max-h-[300px] overflow-y-auto">
                            {(() => {
                              // For JSON files, show a message that full content is needed
                              const isJSON = asset.fileName.toLowerCase().endsWith('.json') || 
                                           asset.fileType === 'ORG_CHART' || 
                                           asset.fileType === 'STAKEHOLDER_PROFILES' || 
                                           asset.fileType === 'MARKET_DATASET' ||
                                           asset.preview.trim().startsWith('{') || 
                                           asset.preview.trim().startsWith('[')
                              
                              if (isJSON && asset.preview.includes('... (truncated)')) {
                                return (
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                                    <p className="font-semibold mb-1">JSON content truncated</p>
                                    <p className="text-xs">Click "Preview" to view the complete data in a professional format.</p>
                                  </div>
                                )
                              }
                              
                              return (
                                <AssetRenderer
                                  content={asset.preview}
                                  fileType={asset.fileType}
                                  fileName={asset.fileName}
                                  mimeType={asset.mimeType}
                                />
                              )
                            })()}
                          </div>
                          {asset.preview.includes('... (truncated)') && (
                            <div className="text-xs text-gray-500 mt-2 italic">Content truncated. Click "Preview" to see full content.</div>
                          )}
                        </div>
                      ) : asset.exists && !asset.preview ? (
                        <div className="p-3 bg-white border-t text-xs text-gray-400 italic">
                          Preview not available
                        </div>
                      ) : null
                    )}
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

