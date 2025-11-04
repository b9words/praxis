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
import { Loader2, CheckCircle, Circle, Sparkles, Settings, Download, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { fetchJson } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

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
    briefingDoc: null
    datasets: any
    storagePath: string
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
  const router = useRouter()
  const [taxonomy, setTaxonomy] = useState<{ arenas: Arena[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selection state
  const [selectedBlueprints, setSelectedBlueprints] = useState<Set<string>>(new Set())
  
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
    provider: 'openai' as 'openai' | 'gemini',
    model: 'gpt-4o-mini',
    includeVisualizations: false,
    includeMermaidDiagrams: false,
    targetWordCount: 2000,
    tone: 'professional' as 'professional' | 'academic' | 'conversational'
  })

  // Preview state
  const [previewCase, setPreviewCase] = useState<GeneratedCase | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Bulk save mutation
  const bulkSaveMutation = useMutation({
    mutationFn: (cases: Array<Omit<GeneratedCase['caseData'], 'competencyIds'> & { competencyIds?: string[] }>) =>
      fetchJson('/api/cases/bulk', {
        method: 'POST',
        body: { cases },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success(`Saved ${variables.length} case${variables.length !== 1 ? 's' : ''} to database!`)
      setProgress(prev => ({ ...prev, results: [] }))
      // Reload existing cases to update status
      loadExistingCases()
      // Refresh the page to show new cases in the Cases tab
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save to database')
    },
  })

  useEffect(() => {
    loadTaxonomy()
    loadExistingCases()
  }, [])

  async function loadTaxonomy() {
    try {
      const response = await fetch('/api/case-taxonomy')
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
          // Extract blueprint IDs from case storage paths or titles
          data.cases.forEach((caseItem: any) => {
            if (caseItem.storagePath) {
              // Try to extract blueprint ID from path
              const match = caseItem.storagePath.match(/cs_([^\/]+)/)
              if (match) {
                existing.add(match[1])
              }
            }
            // Also check if title contains blueprint info
            if (caseItem.title) {
              // This is a heuristic - may need adjustment based on actual data
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

    const results: Array<{ blueprintId: string; caseId: string; success: boolean }> = []
    
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
          const response = await fetch('/api/content-generation/generate-case', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              arenaId: arena.id,
              competencyName: competency.name,
              blueprintId: blueprint.id,
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

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Generation failed')
          }

          const data = await response.json()
          results.push({ 
            blueprintId, 
            caseId: data.caseId, 
            success: true,
            caseData: data.caseData || undefined,
            // Store full case JSON for preview
            fullCase: data.case || undefined
          })
          
          // Trigger asset list refresh
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('case-generated', { detail: { caseId: data.caseId } }))
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Generation failed'
          results.push({ blueprintId, caseId: '', success: false })
          setProgress(prev => ({
            ...prev,
            errors: [...prev.errors, `${blueprint.title}: ${errorMessage}`]
          }))
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
      if (successCount > 0) {
        toast.success(`Generated ${successCount} case${successCount !== 1 ? 's' : ''} successfully!`)
      }
      if (results.some(r => !r.success)) {
        toast.error(`Failed to generate ${results.filter(r => !r.success).length} case${results.filter(r => !r.success).length !== 1 ? 's' : ''}`)
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

  const handleSaveToDatabase = async () => {
    if (progress.results.length === 0) {
      toast.error('No generated cases to save')
      return
    }

    // Filter to only successful cases with caseData
    const casesToSave = progress.results
      .filter((r): r is GeneratedCase & { caseData: NonNullable<GeneratedCase['caseData']> } => 
        r.success && !!r.caseData
      )
      .map((result) => {
        const { caseData } = result
        // Resolve competency IDs from competency names
        // For now, we'll try to fetch competency IDs from the API
        // The metadata contains competencyName, so we'll need to resolve it
        return {
          title: caseData.title,
          description: caseData.description,
          rubric: caseData.rubric,
          briefingDoc: caseData.briefingDoc,
          datasets: caseData.datasets,
          storagePath: caseData.storagePath,
          difficulty: caseData.difficulty,
          estimatedMinutes: caseData.estimatedMinutes,
          prerequisites: caseData.prerequisites,
          metadata: caseData.metadata,
          status: caseData.status,
          // competencyIds will be resolved server-side if needed
          competencyIds: caseData.competencyIds || [],
        }
      })

    if (casesToSave.length === 0) {
      toast.error('No valid cases to save')
      return
    }

    bulkSaveMutation.mutate(casesToSave)
  }

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
        <div className="flex gap-2">
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

        {/* Generation Results */}
        {progress.results.length > 0 && (
          <Card className="mt-4 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Generation Complete</CardTitle>
              <CardDescription>
                {progress.results.filter(r => r.success).length} of {progress.results.length} case{progress.results.length !== 1 ? 's' : ''} generated successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                        )}
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          ✓ Generated
                        </Badge>
                      </div>
                    </div>
                  )
                })}
                
                {progress.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="font-medium text-sm text-red-900 mb-2">Errors:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {progress.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleSaveToDatabase} 
                    className="flex items-center gap-2"
                    disabled={bulkSaveMutation.isPending}
                  >
                    {bulkSaveMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save to Database
                      </>
                    )}
                  </Button>
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
              disabled={selectedBlueprints.size === 0 || progress.isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
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
