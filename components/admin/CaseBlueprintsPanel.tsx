'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle, Circle, Sparkles, Settings, Download, Eye, FolderOpen } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { fetchJson } from '@/lib/api'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import CaseAssetsManager from './CaseAssetsManager'
import { Checkbox } from '@/components/ui/checkbox'

interface Arena {
  id: string
  name: string
  theme: string
  competencies: Competency[]
}

interface Competency {
  name: string
  primaryChallengeType: string
  secondaryTypes: string[]
  blueprints: Blueprint[]
}

interface Blueprint {
  id: string
  title: string
  challengeType: string
  dilemma: string
  task: string
  assets: string[]
}

interface GeneratedCase {
  blueprintId: string
  caseId: string
  success: boolean
  caseData?: {
    title: string
    description: string
    rubric: any
    briefingDoc: string | null
    datasets: any
    storagePath?: string | null // Deprecated - cases are now in DB
    difficulty: string
    estimatedMinutes: number
    prerequisites: any[]
    metadata: any
    status: string
    competencyIds?: string[]
  }
  fullCase?: any // Full case JSON with stages, rubric, briefing, etc.
  error?: string
}

interface GenerationProgress {
  isGenerating: boolean
  currentBlueprint: string
  completed: number
  total: number
  results: GeneratedCase[]
  errors: string[]
}

export default function CaseBlueprintsPanel() {
  const queryClient = useQueryClient()
  const [taxonomy, setTaxonomy] = useState<{ arenas: Arena[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selection state
  const [selectedBlueprints, setSelectedBlueprints] = useState<Set<string>>(new Set())
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<Set<string>>(new Set())
  
  // Filters
  const [arenaFilter, setArenaFilter] = useState<string>('all')
  const [searchFilter, setSearchFilter] = useState<string>('')
  const [showOnlyMissing, setShowOnlyMissing] = useState<boolean>(false)
  
  // Generation state
  const [progress, setProgress] = useState<GenerationProgress>({
    isGenerating: false,
    currentBlueprint: '',
    completed: 0,
    total: 0,
    results: [],
    errors: []
  })
  
  // Existing cases (to show which blueprints already have cases)
  const [existingCases, setExistingCases] = useState<Set<string>>(new Set())
  const [loadingCases, setLoadingCases] = useState(true)
  
  // Config
  const [config, setConfig] = useState({
    provider: 'gemini' as 'openai' | 'gemini',
    model: 'gemini-1.5-flash-latest', // Fastest model for testing - use -latest suffix for v1beta API
    includeVisualizations: false,
    includeMermaidDiagrams: false,
    targetWordCount: 2000,
    tone: 'professional' as 'professional' | 'academic' | 'conversational'
  })
  
  // Thumbnail generation option
  const [skipThumbnail, setSkipThumbnail] = useState<boolean>(false)

  // Preview state
  const [previewCase, setPreviewCase] = useState<GeneratedCase | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  
  // Assets manager state
  const [assetsManagerOpen, setAssetsManagerOpen] = useState(false)
  const [assetsManagerCaseId, setAssetsManagerCaseId] = useState<string | null>(null)

  // Cases are automatically saved during generation, so no bulk save mutation needed

  // Fetch competencies for selection
  const { data: competencies = [] } = useQuery({
    queryKey: ['admin-content', 'competencies'],
    queryFn: async () => {
      const res = await fetch('/api/admin/content/competencies', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch competencies')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    loadTaxonomy()
    loadExistingCases()
  }, [])


  async function loadTaxonomy() {
    try {
      const response = await fetch('/api/case-taxonomy', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load taxonomy')
      const data = await response.json()
      setTaxonomy(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load taxonomy')
    } finally {
      setLoading(false)
    }
  }

  async function loadExistingCases() {
    setLoadingCases(true)
    try {
      const response = await fetch('/api/cases?status=all')
      if (response.ok) {
        const data = await response.json()
        const existing = new Set<string>()
        if (data.cases) {
          // Extract blueprint IDs from case metadata (cases are now in DB)
          data.cases.forEach((caseItem: any) => {
            // Check metadata for blueprintId
            if (caseItem.metadata?.blueprintId) {
              existing.add(caseItem.metadata.blueprintId)
            }
            // Also check metadata.caseId (from generation)
            if (caseItem.metadata?.caseId) {
              // Extract blueprint ID from caseId format: cs_blueprintId_timestamp
              const match = caseItem.metadata.caseId.match(/^cs_([^_]+)/)
              if (match) {
                existing.add(match[1])
              }
            }
            // Fallback: check title (heuristic)
            if (caseItem.title) {
              const blueprintId = caseItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')
              existing.add(blueprintId)
            }
          })
        }
        setExistingCases(existing)
      }
    } catch (err) {
      console.error('Error loading existing cases:', err)
    } finally {
      setLoadingCases(false)
    }
  }

  // Filter blueprints
  const filteredBlueprints = useMemo(() => {
    if (!taxonomy) return []
    
    let blueprints: Array<{ blueprint: Blueprint; arena: Arena; competency: Competency }> = []
    
    for (const arena of taxonomy.arenas) {
      // Arena filter
      if (arenaFilter !== 'all' && arena.id !== arenaFilter) continue
      
      for (const competency of arena.competencies) {
        for (const blueprint of competency.blueprints) {
          // Search filter
          if (searchFilter && 
              !blueprint.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
              !blueprint.dilemma.toLowerCase().includes(searchFilter.toLowerCase()) &&
              !blueprint.task.toLowerCase().includes(searchFilter.toLowerCase()) &&
              !competency.name.toLowerCase().includes(searchFilter.toLowerCase()) &&
              !arena.name.toLowerCase().includes(searchFilter.toLowerCase())) {
            continue
          }
          
          // Show only missing filter
          if (showOnlyMissing && existingCases.has(blueprint.id)) {
            continue
          }
          
          blueprints.push({ blueprint, arena, competency })
        }
      }
    }
    
    return blueprints
  }, [taxonomy, arenaFilter, searchFilter, showOnlyMissing, existingCases])

  // Group by arena and competency
  const blueprintsByArena = useMemo(() => {
    const grouped: Record<string, {
      arena: Arena
      competencies: Record<string, {
        competency: Competency
        blueprints: typeof filteredBlueprints
      }>
    }> = {}
    
    for (const { blueprint, arena, competency } of filteredBlueprints) {
      if (!grouped[arena.id]) {
        grouped[arena.id] = { arena, competencies: {} }
      }
      if (!grouped[arena.id].competencies[competency.name]) {
        grouped[arena.id].competencies[competency.name] = { competency, blueprints: [] }
      }
      grouped[arena.id].competencies[competency.name].blueprints.push({ blueprint, arena, competency })
    }
    
    return grouped
  }, [filteredBlueprints])

  const toggleBlueprintSelection = (blueprintId: string) => {
    const newSelection = new Set(selectedBlueprints)
    if (newSelection.has(blueprintId)) {
      newSelection.delete(blueprintId)
    } else {
      newSelection.add(blueprintId)
    }
    setSelectedBlueprints(newSelection)
  }

  const selectAllFiltered = () => {
    const ids = new Set(filteredBlueprints.map(({ blueprint }) => blueprint.id))
    setSelectedBlueprints(ids)
  }

  const deselectAll = () => {
    setSelectedBlueprints(new Set())
  }

  const selectOnlyMissing = () => {
    const missingIds = filteredBlueprints
      .filter(({ blueprint }) => !existingCases.has(blueprint.id))
      .map(({ blueprint }) => blueprint.id)
    setSelectedBlueprints(new Set(missingIds))
  }

  async function handleGenerate() {
    if (selectedBlueprints.size === 0) {
      toast.error('Please select at least one blueprint')
      return
    }

    setProgress({
      isGenerating: true,
      currentBlueprint: '',
      completed: 0,
      total: selectedBlueprints.size,
      results: [],
      errors: []
    })

    const results: Array<{ blueprintId: string; caseId: string; success: boolean; caseData?: any; fullCase?: any; error?: string }> = []
    
    try {
      for (const blueprintId of selectedBlueprints) {
        const { blueprint, arena, competency } = filteredBlueprints.find(
          ({ blueprint: bp }) => bp.id === blueprintId
        ) || { blueprint: null, arena: null, competency: null }
        
        if (!blueprint || !arena || !competency) {
          results.push({ blueprintId, caseId: '', success: false })
          continue
        }

        setProgress(prev => ({
          ...prev,
          currentBlueprint: blueprint.title,
          completed: results.length
        }))

        try {
          // Prepare competency IDs to associate with the case
          const competencyIdsArray = Array.from(selectedCompetencyIds)
          
          const response = await fetch('/api/content-generation/generate-case', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              arenaId: arena.id,
              competencyName: competency.name,
              blueprintId: blueprint.id,
              competencyIds: competencyIdsArray.length > 0 ? competencyIdsArray : undefined, // Optional - only send if selected
              skipThumbnail: skipThumbnail,
              options: {
                provider: config.provider,
                model: config.model,
                includeVisualizations: config.includeVisualizations,
                includeMermaidDiagrams: config.includeMermaidDiagrams,
                targetWordCount: config.targetWordCount,
                tone: config.tone,
              },
            }),
          })

          // Parse response once
          let responseData: any
          try {
            responseData = await response.json()
          } catch (parseError) {
            // If JSON parsing fails, throw error with status info
            const error = new Error(response.statusText || `HTTP ${response.status}: Invalid response`)
            ;(error as any).response = response
            throw error
          }

          if (!response.ok) {
            // Extract error details from failed response
            const errorMessage = responseData.error || 'Generation failed'
            const errorDetails = responseData.details || ''
            
            // Throw error with details attached
            const error = new Error(errorMessage)
            ;(error as any).details = errorDetails
            ;(error as any).response = response
            throw error
          }

          // Use parsed response data
          const data = responseData
          // Ensure caseId is a string (not an object)
          const caseIdString = typeof data.caseId === 'string' ? data.caseId : String(data.caseId || '')
          
          results.push({ 
            blueprintId, 
            caseId: caseIdString, 
            success: true,
            caseData: data.caseData || undefined,
            // Store full case JSON for preview
            fullCase: data.case || undefined
          })
        } catch (err: any) {
          // Extract detailed error information from API response
          let errorMessage = 'Generation failed'
          let errorDetails = err?.details || ''
          
          // If we have a response object, try to extract error details
          // Note: Response body can only be read once, so if we already read it, use attached details
          if (err?.details) {
            // Details already attached from the error we threw
            errorDetails = err.details
          } else if (err?.response) {
            // Response exists but body not yet read - try to read it
            try {
              // Check if response body has been consumed
              const clonedResponse = err.response.clone ? err.response.clone() : err.response
              const errorData = await clonedResponse.json().catch(() => null)
              if (errorData?.error) {
                errorMessage = errorData.error
                errorDetails = errorData.details || ''
              } else {
                errorMessage = err.response.statusText || errorMessage
              }
            } catch {
              // If JSON parsing fails, use status text
              errorMessage = err.response.statusText || errorMessage
            }
          } else if (err instanceof Error) {
            errorMessage = err.message
            // Use attached details if available
            if ((err as any).details) {
              errorDetails = (err as any).details
            }
          }
          
          const fullErrorMessage = errorDetails 
            ? `${errorMessage}: ${errorDetails}`
            : errorMessage
          
          // Check if this is a duplicate error - mark as skipped rather than failed
          const isDuplicate = errorMessage?.includes('already exists') || errorDetails?.includes('already exists') || errorDetails?.includes('blueprint ID')
          
          results.push({ 
            blueprintId, 
            caseId: '', 
            success: false, 
            error: isDuplicate ? `Skipped: ${errorDetails || errorMessage}` : fullErrorMessage 
          })
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `${blueprint.title}: ${isDuplicate ? 'Skipped (already exists)' : fullErrorMessage}`]
          }))
          
          // Show toast with appropriate severity
          if (isDuplicate) {
            toast.warning(`${blueprint.title}: Already exists`, {
              description: errorDetails || 'This case was already generated previously.',
              duration: 4000,
            })
          } else {
            toast.error(`${blueprint.title}: ${errorMessage}`, {
              description: errorDetails || undefined,
              duration: 5000,
            })
          }
        }

        // Small delay between generations
        if (results.length < selectedBlueprints.size) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      setProgress(prev => ({
        ...prev,
        isGenerating: false,
        completed: results.length,
        results
      }))

      const successCount = results.filter(r => r.success).length
      const failedResults = results.filter(r => !r.success)
      const skippedCount = failedResults.filter(r => r.error?.includes('Skipped') || r.error?.includes('already exists')).length
      const failedCount = failedResults.length - skippedCount
      
      if (successCount > 0) {
        toast.success(`Generated ${successCount} case${successCount !== 1 ? 's' : ''} successfully!`)
        // Invalidate admin-content queries to refresh the main content table
        queryClient.invalidateQueries({ queryKey: ['admin-content'] })
        
        // Auto-open assets manager for the first successfully generated case
        const firstSuccess = results.find(r => r.success && r.caseId)
        if (firstSuccess && firstSuccess.caseId) {
          // Normalize caseId - ensure it's a string and not [object Object]
          let caseIdStr: string | null = null
          if (typeof firstSuccess.caseId === 'string') {
            caseIdStr = firstSuccess.caseId.trim()
            if (caseIdStr === '[object Object]' || caseIdStr === 'object Object') {
              caseIdStr = null
            }
          } else if (typeof firstSuccess.caseId === 'object' && firstSuccess.caseId !== null && 'id' in firstSuccess.caseId) {
            // If it's an object with id, extract it
            const objId = (firstSuccess.caseId as any).id
            if (typeof objId === 'string') {
              caseIdStr = objId.trim()
            }
          } else {
            // Try to convert to string
            const converted = String(firstSuccess.caseId).trim()
            if (converted && converted !== '[object Object]' && converted !== 'object Object') {
              caseIdStr = converted
            }
          }
          
          if (caseIdStr) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
              setAssetsManagerCaseId(caseIdStr!)
              setAssetsManagerOpen(true)
            }, 300)
          }
        }
      }
      if (skippedCount > 0) {
        toast.warning(`Skipped ${skippedCount} case${skippedCount !== 1 ? 's' : ''} (already exist)`)
      }
      if (failedCount > 0) {
        toast.error(`Failed to generate ${failedCount} case${failedCount !== 1 ? 's' : ''}`)
      }

      // Reload existing cases
      await loadExistingCases()
    } catch (error) {
      console.error('Generation error:', error)
      setProgress(prev => ({
        ...prev,
        isGenerating: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      }))
      toast.error('Generation failed')
    }
  }

  // Removed handleSaveToDatabase - cases are automatically saved during generation

  const exportResults = () => {
    if (progress.results.length === 0) {
      toast.error('No results to export')
      return
    }

    const dataStr = JSON.stringify(progress.results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `case-studies-${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Determine if generation should be disabled
  const generationDisabled = selectedBlueprints.size === 0 || progress.isGenerating

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Case Study Blueprints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !taxonomy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Case Study Blueprints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Study Blueprints</CardTitle>
        <CardDescription>
          Select blueprints to generate case studies from the taxonomy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="arena-filter">Filter by Arena</Label>
            <Select value={arenaFilter} onValueChange={setArenaFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Arenas</SelectItem>
                {taxonomy?.arenas.map((arena) => (
                  <SelectItem key={arena.id} value={arena.id}>
                    {arena.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="blueprint-search">Search Blueprints</Label>
            <Input
              id="blueprint-search"
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by title, dilemma, task..."
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2 w-full">
              <Switch
                id="show-missing"
                checked={showOnlyMissing}
                onCheckedChange={setShowOnlyMissing}
              />
              <Label htmlFor="show-missing" className="cursor-pointer">
                Show only missing cases
              </Label>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        <div className="flex gap-2 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectAllFiltered}>
              Select All ({filteredBlueprints.length})
            </Button>
            <Button variant="outline" size="sm" onClick={selectOnlyMissing}>
              Select Missing Only
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="skipThumbnail"
              checked={skipThumbnail}
              onCheckedChange={setSkipThumbnail}
            />
            <Label htmlFor="skipThumbnail" className="text-sm cursor-pointer">
              Skip Thumbnail
            </Label>
          </div>
        </div>

        {/* Competency Selection */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Link to Competencies (Optional)</CardTitle>
            <CardDescription className="text-xs">
              Select competencies to associate with generated cases. Leave empty to skip association.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {competencies.length === 0 ? (
                <p className="text-xs text-gray-500">Loading competencies...</p>
              ) : (
                competencies.map((comp: any) => (
                  <div key={comp.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`comp-${comp.id}`}
                      checked={selectedCompetencyIds.has(comp.id)}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(selectedCompetencyIds)
                        if (checked) {
                          newSet.add(comp.id)
                        } else {
                          newSet.delete(comp.id)
                        }
                        setSelectedCompetencyIds(newSet)
                      }}
                    />
                    <Label
                      htmlFor={`comp-${comp.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {comp.name}
                      {comp.level && (
                        <span className="text-xs text-gray-500 ml-2">({comp.level})</span>
                      )}
                    </Label>
                  </div>
                ))
              )}
            </div>
            {selectedCompetencyIds.size > 0 && (
              <div className="mt-3 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCompetencyIds(new Set())}
                  className="text-xs"
                >
                  Clear Selection ({selectedCompetencyIds.size})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blueprint List */}
        {loadingCases ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">Loading case status...</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[600px] overflow-y-auto">
            {Object.entries(blueprintsByArena).map(([arenaId, { arena, competencies }]) => (
              <div key={arenaId} className="border-l-4 border-l-blue-500 pl-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {arena.name}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({Object.values(competencies).reduce((sum, c) => sum + c.blueprints.length, 0)} blueprint{Object.values(competencies).reduce((sum, c) => sum + c.blueprints.length, 0) !== 1 ? 's' : ''})
                  </span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">{arena.theme}</p>
                
                <div className="space-y-4">
                  {Object.entries(competencies).map(([compName, { competency, blueprints }]) => (
                    <Card key={compName} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{competency.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {blueprints.map(({ blueprint }) => {
                            const exists = existingCases.has(blueprint.id)
                            const isSelected = selectedBlueprints.has(blueprint.id)
                            
                            return (
                              <div
                                key={blueprint.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                                onClick={() => toggleBlueprintSelection(blueprint.id)}
                              >
                                {isSelected ? (
                                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm">{blueprint.title}</h4>
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{blueprint.dilemma}</p>
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        <Badge variant="outline" className="text-xs">
                                          {blueprint.challengeType}
                                        </Badge>
                                        {blueprint.assets.slice(0, 2).map((asset, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {asset}
                                          </Badge>
                                        ))}
                                        {blueprint.assets.length > 2 && (
                                          <Badge variant="secondary" className="text-xs">
                                            +{blueprint.assets.length - 2}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {exists ? (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 flex-shrink-0">
                                        ✓ Created
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300 flex-shrink-0">
                                        Missing
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            
            {filteredBlueprints.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">No blueprints match your filters</p>
              </div>
            )}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewCase?.fullCase?.title || 'Case Preview'}</DialogTitle>
              <DialogDescription>
                Full case study content - stages, rubric, briefing, and assets
              </DialogDescription>
            </DialogHeader>
            {previewCase?.fullCase ? (
              <div className="mt-4 space-y-4">
                {/* Briefing Section */}
                {previewCase.fullCase.briefing && (
                  <div>
                    <h3 className="font-semibold mb-2">Briefing</h3>
                    <div className="bg-gray-50 p-4 rounded border">
                      <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(previewCase.fullCase.briefing, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {/* Stages */}
                {previewCase.fullCase.stages && previewCase.fullCase.stages.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Stages ({previewCase.fullCase.stages.length})</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {previewCase.fullCase.stages.map((stage: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded border">
                          <p className="font-medium text-sm mb-1">Stage {idx + 1}: {stage.stageName || stage.title}</p>
                          <pre className="whitespace-pre-wrap text-xs text-gray-600">{JSON.stringify(stage, null, 2).substring(0, 500)}...</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Rubric */}
                {previewCase.fullCase.rubric && (
                  <div>
                    <h3 className="font-semibold mb-2">Rubric</h3>
                    <div className="bg-gray-50 p-4 rounded border">
                      <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(previewCase.fullCase.rubric, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {/* Case Files */}
                {previewCase.fullCase.caseFiles && previewCase.fullCase.caseFiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Case Files ({previewCase.fullCase.caseFiles.length})</h3>
                    <div className="space-y-1">
                      {previewCase.fullCase.caseFiles.map((file: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-2 rounded border text-sm">
                          <span className="font-medium">{file.fileName}</span>
                          <span className="text-gray-600 ml-2">({file.fileType})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Full JSON */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold mb-2">Full JSON</summary>
                  <div className="bg-gray-50 p-4 rounded border max-h-[400px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(previewCase.fullCase, null, 2)}</pre>
                  </div>
                </details>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No preview data available
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assets Manager Dialog */}
        {assetsManagerOpen && assetsManagerCaseId && (
          <Dialog open={assetsManagerOpen} onOpenChange={(open) => {
            if (!open) {
              setAssetsManagerOpen(false)
              setAssetsManagerCaseId(null)
            }
          }}>
            <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                <DialogTitle className="text-lg">Case Assets</DialogTitle>
                <DialogDescription>
                  View and manage assets for this case study. Assets are automatically loaded from the database.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <CaseAssetsManager 
                  initialCaseId={assetsManagerCaseId}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Generation Results */}
        {progress.results.length > 0 && (
          <Card className="mt-4 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Generation Complete</CardTitle>
              <CardDescription>
                {(() => {
                  const successCount = progress.results.filter(r => r.success).length
                  const skippedCount = progress.results.filter(r => !r.success && (r.error?.includes('Skipped') || r.error?.includes('already exists'))).length
                  const failedCount = progress.results.filter(r => !r.success && !r.error?.includes('Skipped') && !r.error?.includes('already exists')).length
                  const parts: string[] = []
                  if (successCount > 0) parts.push(`${successCount} generated`)
                  if (skippedCount > 0) parts.push(`${skippedCount} skipped`)
                  if (failedCount > 0) parts.push(`${failedCount} failed`)
                  return parts.join(', ') || 'No results'
                })()} of {progress.results.length} case{progress.results.length !== 1 ? 's' : ''}
                <span className="block mt-1 text-xs text-gray-600">
                  Note: Cases are automatically saved to the database upon successful generation.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Show successful results */}
                {progress.results.filter(r => r.success).map((result) => {
                  const { blueprint, arena, competency } = filteredBlueprints.find(
                    ({ blueprint: bp }) => bp.id === result.blueprintId
                  ) || { blueprint: null, arena: null, competency: null }
                  
                  return (
                    <div key={result.blueprintId} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{blueprint?.title || result.blueprintId}</p>
                        <p className="text-xs text-gray-600 mt-1">Case ID: {result.caseId}</p>
                        {result.fullCase && (
                          <div className="flex gap-1 mt-2">
                            {result.fullCase.stages && (
                              <Badge variant="outline" className="text-xs">
                                {result.fullCase.stages.length} stages
                              </Badge>
                            )}
                            {result.fullCase.rubric && (
                              <Badge variant="outline" className="text-xs">
                                Rubric
                              </Badge>
                            )}
                            {result.fullCase.caseFiles && (
                              <Badge variant="outline" className="text-xs">
                                {result.fullCase.caseFiles.length} assets
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                            {result.fullCase && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewCase(result)
                                    setPreviewOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Preview
                                </Button>
                                {result.caseId && typeof result.caseId === 'string' && result.caseId.trim() && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Ensure caseId is a string before passing
                                      const caseIdStr = String(result.caseId).trim()
                                      if (caseIdStr) {
                                        setAssetsManagerCaseId(caseIdStr)
                                        setAssetsManagerOpen(true)
                                      } else {
                                        toast.error('Case ID is missing or invalid')
                                      }
                                    }}
                                  >
                                    <FolderOpen className="h-4 w-4 mr-1" />
                                    View Assets
                                  </Button>
                                )}
                              </>
                            )}
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          ✓ Generated
                        </Badge>
                      </div>
                    </div>
                  )
                })}
                
                {/* Show skipped results (duplicates) */}
                {progress.results.filter(r => !r.success && (r.error?.includes('Skipped') || r.error?.includes('already exists'))).map((result) => {
                  const { blueprint } = filteredBlueprints.find(
                    ({ blueprint: bp }) => bp.id === result.blueprintId
                  ) || { blueprint: null }
                  
                  return (
                    <div key={result.blueprintId} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{blueprint?.title || result.blueprintId}</p>
                        <p className="text-xs text-yellow-700 mt-1">{result.error || 'Already exists'}</p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        ⚠ Skipped
                      </Badge>
                    </div>
                  )
                })}
                
                {/* Show failed results (actual errors) */}
                {progress.results.filter(r => !r.success && !r.error?.includes('Skipped') && !r.error?.includes('already exists')).map((result) => {
                  const { blueprint } = filteredBlueprints.find(
                    ({ blueprint: bp }) => bp.id === result.blueprintId
                  ) || { blueprint: null }
                  
                  return (
                    <div key={result.blueprintId} className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{blueprint?.title || result.blueprintId}</p>
                        <p className="text-xs text-red-700 mt-1">{result.error || 'Generation failed'}</p>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        ✗ Failed
                      </Badge>
                    </div>
                  )
                })}

                <div className="flex gap-2 pt-2">
                  {/* Cases are automatically saved during generation - no manual save needed */}
                  <Button variant="outline" onClick={exportResults} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Selection Summary */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">
                {selectedBlueprints.size} blueprint{selectedBlueprints.size !== 1 ? 's' : ''} selected
                {filteredBlueprints.length < (taxonomy?.arenas.reduce((sum, a) => sum + a.competencies.reduce((s, c) => s + c.blueprints.length, 0), 0) || 0) && (
                  <span className="text-sm font-normal text-blue-700 ml-2">
                    ({filteredBlueprints.length} shown)
                  </span>
                )}
              </p>
              <p className="text-sm text-blue-700">
                Estimated generation time: {Math.ceil(selectedBlueprints.size * 3)} minutes
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generationDisabled}
              className="bg-blue-600 hover:bg-blue-700"
              title={
                selectedBlueprints.size === 0
                  ? 'Please select at least one blueprint to generate'
                  : undefined
              }
            >
              {progress.isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate ({selectedBlueprints.size})
                </>
              )}
            </Button>
          </div>
          
          {progress.isGenerating && (
            <div className="mt-4">
              <Progress value={(progress.completed / progress.total) * 100} className="mb-2" />
              <p className="text-sm text-blue-700">
                Generating: {progress.currentBlueprint} ({progress.completed}/{progress.total})
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
