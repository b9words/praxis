'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchJson } from '@/lib/api'
import { DEFAULT_MODELS, GeneratedLesson, GenerationOptions, LessonStructure } from '@/lib/content-generator'
import { completeCurriculumData, getAllLessonsFlat } from '@/lib/curriculum-data'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Circle, Download, Eye, Play, RefreshCw, Settings, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface CurriculumGeneratorProps {
  competencies?: any[] // No longer required, kept for backward compatibility
}

interface GenerationProgress {
  isGenerating: boolean
  currentLesson: string
  completed: number
  total: number
  results: GeneratedLesson[]
  errors: string[]
}

export default function CurriculumGenerator({ competencies }: CurriculumGeneratorProps) {
  const queryClient = useQueryClient()
  
  // Configuration
  const [config, setConfig] = useState<GenerationOptions>({
    provider: 'gemini',
    model: 'gemini-2.5-pro', // Default to Gemini 2.5 Pro
    includeVisualizations: true,
    includeMermaidDiagrams: true,
    targetWordCount: 2500,
    tone: 'professional'
  })
  
  // Thumbnail generation option
  const [skipThumbnail, setSkipThumbnail] = useState<boolean>(false)

  // Get all lessons from the platform (all 219 lessons across 10 domains)
  const allLessons = getAllLessonsFlat()
  
  // API Keys - fetched from server
  const [apiKeysConfigured, setApiKeysConfigured] = useState<{
    openai: boolean
    gemini: boolean
  } | null>(null)
  
  // Lesson existence check
  const [existingArticles, setExistingArticles] = useState<Set<string>>(new Set())
  const [loadingArticles, setLoadingArticles] = useState(true)
  
  // Filter lessons by domain/search
  const [lessonDomainFilter, setLessonDomainFilter] = useState<string>('all')
  const [lessonSearchFilter, setLessonSearchFilter] = useState<string>('')
  const [showOnlyMissing, setShowOnlyMissing] = useState<boolean>(false)
  
  const filteredLessons = allLessons.filter(lesson => {
    // Domain filter
    if (lessonDomainFilter !== 'all' && lesson.domain !== lessonDomainFilter) {
      return false
    }
    // Search filter
    if (lessonSearchFilter && !lesson.lessonTitle.toLowerCase().includes(lessonSearchFilter.toLowerCase()) &&
        !lesson.moduleTitle.toLowerCase().includes(lessonSearchFilter.toLowerCase()) &&
        !lesson.domainTitle.toLowerCase().includes(lessonSearchFilter.toLowerCase())) {
      return false
    }
    // Show only missing filter
    if (showOnlyMissing) {
      const lessonPath = `${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`
      if (existingArticles.has(lessonPath)) {
        return false
      }
    }
    return true
  })
  
  // Group lessons by domain for better organization
  const lessonsByDomain = filteredLessons.reduce((acc, lesson, index) => {
    if (!acc[lesson.domain]) {
      acc[lesson.domain] = {
        domainTitle: lesson.domainTitle,
        lessons: []
      }
    }
    acc[lesson.domain].lessons.push({ ...lesson, originalIndex: index })
    return acc
  }, {} as Record<string, { domainTitle: string; lessons: Array<typeof allLessons[0] & { originalIndex: number }> }>)
  
  // Generation state
  const [progress, setProgress] = useState<GenerationProgress>({
    isGenerating: false,
    currentLesson: '',
    completed: 0,
    total: 0,
    results: [],
    errors: []
  })
  
  // UI state - track by lesson path instead of index
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set())
  const [previewLesson, setPreviewLesson] = useState<GeneratedLesson | null>(null)

  // Bulk save mutation
  const bulkSaveMutation = useMutation({
    mutationFn: async (articles: Array<{ title: string; content: string; competencyId: string; status: string }>) => {
      console.log(`[bulkSaveMutation] Attempting to save ${articles.length} articles`)
      const response = await fetch('/api/articles/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`[bulkSaveMutation] API response:`, data)
      
      // VERIFY articles actually exist in database
      if (data.count > 0 && data.successes && data.successes.length > 0) {
        console.log(`[bulkSaveMutation] Verifying ${data.successes.length} articles exist in DB...`)
        const verifyResponse = await fetch(`/api/admin/content/articles?page=1&pageSize=100`, { cache: 'no-store' })
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          const savedIds = data.successes.map((a: any) => a.id)
          const foundIds = verifyData.items.map((a: any) => a.id)
          const found = savedIds.filter((id: string) => foundIds.includes(id))
          console.log(`[bulkSaveMutation] Verification: ${found.length}/${savedIds.length} articles found in admin content API`)
          if (found.length === 0 && savedIds.length > 0) {
            console.error(`[bulkSaveMutation] ⚠️  WARNING: Articles saved but not found in admin content API!`)
            console.error(`[bulkSaveMutation] Saved IDs:`, savedIds)
            console.error(`[bulkSaveMutation] Found IDs:`, foundIds.slice(0, 10))
            console.error(`[bulkSaveMutation] Check filters/permissions - articles may be hidden by status or competency filters`)
          }
        }
      }
      
      return data
    },
    onSuccess: async (result, variables) => {
      const attempted = result.attempted || variables.length
      const count = result.count || 0
      const failures = result.failures || []
      
      console.log(`[bulkSaveMutation] Success callback - count: ${count}, attempted: ${attempted}`)
      
      if (count === 0) {
        // Show detailed error with failure reasons
        const failureReasons = failures.slice(0, 5).map(f => `${f.title}: ${f.error}`).join('; ')
        toast.error(
          `Failed to save any articles. ${failures.length > 0 ? `Errors: ${failureReasons}${failures.length > 5 ? '...' : ''}` : 'Check console for details.'}`,
          { duration: 10000 }
        )
        // DO NOT clear results - allow user to retry
        return
      }
      
      // Invalidate all article-related queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.articles.all() })
      
      // Invalidate admin content queries - use prefix matching to catch all filter variations
      await queryClient.invalidateQueries({ 
        queryKey: ['admin-content'],
        exact: false // Match all queries starting with 'admin-content'
      })
      
      // Force refetch of admin content
      await queryClient.refetchQueries({ 
        queryKey: ['admin-content'],
        exact: false
      })
      
      // Show accurate success message
      if (failures.length > 0) {
        const failureReasons = failures.slice(0, 3).map(f => f.title).join(', ')
        toast.success(
          `Saved ${count} of ${attempted} lessons. Failed: ${failureReasons}${failures.length > 3 ? ` (+${failures.length - 3} more)` : ''}`,
          { duration: 8000 }
        )
      } else {
        toast.success(`Saved ${count} lessons to database!`)
      }
      
      // Only clear results if we saved at least one
      setProgress(prev => ({ ...prev, results: [] }))
    },
    onError: (error) => {
      console.error(`[bulkSaveMutation] Error:`, error)
      toast.error(error instanceof Error ? error.message : 'Failed to save to database')
    },
  })

  useEffect(() => {
    // Check API key configuration
    const checkApiKeys = async () => {
      try {
        const response = await fetch('/api/content-generation/config')
        if (response.ok) {
          const data = await response.json()
          setApiKeysConfigured({
            openai: data.providers.openai.available,
            gemini: data.providers.gemini.available,
          })
        }
      } catch (error) {
        console.error('Error checking API keys:', error)
      }
    }
    checkApiKeys()
    
    // Load existing articles to show which lessons are already created
    const loadExistingArticles = async () => {
      setLoadingArticles(true)
      try {
        const response = await fetch('/api/articles?status=all')
        if (response.ok) {
          const data = await response.json()
          const existing = new Set<string>()
          if (data.articles) {
            data.articles.forEach((article: any) => {
              if (article.storagePath) {
                // Extract domain/module/lesson from storagePath
                // Format: articles/{domain}/{module}/{lesson}.md or content/curriculum/{domain}/{module}/{lesson}.md
                const match = article.storagePath.match(/(?:articles|content\/curriculum)\/([^\/]+)\/([^\/]+)\/([^\/]+)\.md/)
                if (match) {
                  const [, domain, module, lesson] = match
                  existing.add(`${domain}/${module}/${lesson}`)
                }
              }
            })
          }
          setExistingArticles(existing)
        }
      } catch (error) {
        console.error('Error loading existing articles:', error)
      } finally {
        setLoadingArticles(false)
      }
    }
    loadExistingArticles()
    
  }, [])

  // Helper to resolve competency for a lesson
  const resolveCompetencyForLesson = async (domainId: string, moduleId: string, lessonTitle: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/content-generation/resolve-competency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId, moduleId, lessonTitle }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`[resolve-competency] API error (${response.status}):`, errorData)
        // Try GET as fallback if POST doesn't work (some Next.js routing issues)
        if (response.status === 404) {
          console.warn('[resolve-competency] 404 error - route may not be registered yet')
        }
        return null
      }
      
      const data = await response.json()
      if (data.competencyId) {
        console.log(`[resolve-competency] Resolved competency for ${lessonTitle}:`, data.competencyId)
        return data.competencyId
      }
      
      console.warn(`[resolve-competency] No competencyId in response for ${lessonTitle}`)
      return null
    } catch (error) {
      console.error('[resolve-competency] Error resolving competency:', error)
      return null
    }
  }

  const handleGenerateSelected = async () => {
    // Check if selected provider has API key configured
    if (config.provider === 'openai' && !apiKeysConfigured?.openai) {
      toast.error('OpenAI API key is not configured. Please set OPENAI_API_KEY in environment variables.')
      return
    }
    if (config.provider === 'gemini' && !apiKeysConfigured?.gemini) {
      toast.error('Gemini API key is not configured. Please set GEMINI_API_KEY in environment variables.')
      return
    }

    // Convert selected lesson paths to LessonStructure format with competency resolution
    const selectedLessonStructures: Array<LessonStructure & { lessonPath: string; competencyId: string | null }> = []
    let lessonsWithoutCompetency = 0
    
    for (const lessonPath of selectedLessons) {
      const lesson = allLessons.find(l => `${l.domain}/${l.moduleId}/${l.lessonId}` === lessonPath)
      if (lesson) {
        // Resolve competency for this lesson (but don't block if it fails)
        const competencyId = await resolveCompetencyForLesson(lesson.domain, lesson.moduleId, lesson.lessonTitle)
        
        if (!competencyId) {
          console.warn(`Could not resolve competency for lesson: ${lesson.lessonTitle}. Will use default competency.`)
          lessonsWithoutCompetency++
        }

        selectedLessonStructures.push({
          moduleNumber: lesson.moduleNumber,
          moduleName: lesson.moduleTitle,
          lessonNumber: lesson.lessonNumber,
          lessonName: lesson.lessonTitle,
          description: lesson.description,
          lessonPath,
          competencyId: competencyId || null // Pass null, API will handle it
        })
      }
    }
    
    if (selectedLessonStructures.length === 0) {
      toast.error('No lessons selected to generate')
      return
    }

    if (lessonsWithoutCompetency > 0) {
      toast.info(`${lessonsWithoutCompetency} lesson(s) will use default competency`)
    }

    setProgress({
      isGenerating: true,
      currentLesson: '',
      completed: 0,
      total: selectedLessonStructures.length,
      results: [],
      errors: []
    })

    try {
      // Generate lessons one by one via API route (server-side)
      const results: GeneratedLesson[] = []
      for (let i = 0; i < selectedLessonStructures.length; i++) {
        const lessonStruct = selectedLessonStructures[i]
        const { lessonPath, competencyId, ...structure } = lessonStruct
        
        // Get domain information from original lesson data
        const originalLesson = allLessons.find(l => `${l.domain}/${l.moduleId}/${l.lessonId}` === lessonPath)
        const domainTitle = originalLesson?.domainTitle || structure.moduleName
        
        setProgress(prev => ({
          ...prev,
          completed: i,
          total: selectedLessonStructures.length,
          currentLesson: structure.lessonName
        }))

        try {
          // Call server-side API route for generation with timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 6 * 60 * 1000) // 6 minutes timeout
          
          try {
            const response = await fetch('/api/content-generation/generate-lesson', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lesson: structure,
                options: config,
                competencyId: competencyId!,
                domainTitle: domainTitle,
              }),
              signal: controller.signal,
            })
            
            clearTimeout(timeoutId)

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const data = await response.json()
            results.push({
              ...data.lesson,
              lessonPath
            } as any)
            
            // Add delay between requests to avoid rate limiting
            if (i < selectedLessonStructures.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          } catch (fetchError) {
            clearTimeout(timeoutId)
            throw fetchError
          }
        } catch (error) {
          console.error(`Failed to generate lesson ${structure.lessonName}:`, error)
          const errorMessage = error instanceof Error 
            ? (error.name === 'AbortError' ? 'Request timeout - generation took too long' : error.message)
            : 'Unknown error'
          results.push({
            title: structure.lessonName,
            content: '',
            competencyId: competencyId!,
            status: 'draft',
            metadata: {},
            lessonPath,
            error: errorMessage
          } as any)
        }
      }

      setProgress(prev => ({
        ...prev,
        isGenerating: false,
        results,
        currentLesson: 'Complete',
        completed: selectedLessonStructures.length
      }))

      // Auto-preview the first successfully generated lesson
      const firstSuccessResult = results.find((r: any) => r.content && !r.error)
      if (firstSuccessResult) {
        setPreviewLesson(firstSuccessResult)
      }

      toast.success(`Generated ${results.length} lessons successfully!`)
    } catch (error) {
      console.error('Generation error:', error)
      setProgress(prev => ({
        ...prev,
        isGenerating: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      }))
      toast.error('Generation failed. Check console for details.')
    }
  }

  const handleSaveToDatabase = () => {
    if (progress.results.length === 0) {
      toast.error('No generated content to save')
      return
    }

    // Map results to articles with proper storage paths and metadata
    const articlesToInsert = progress.results.map((lesson: any) => {
      const lessonPath = lesson.lessonPath || null
      
      // Extract domain, module, lesson from path: domain/module/lesson
      let storagePath = null
      
      // Start with existing metadata (preserves thumbnailUrl, thumbnailType, etc.)
      let metadata: any = { ...(lesson.metadata || {}) }
      
      if (lessonPath) {
        const [domain, module, lessonId] = lessonPath.split('/')
        storagePath = `content/curriculum/${domain}/${module}/${lessonId}.md`
        
        // Find the lesson data for metadata
        const lessonData = allLessons.find(l => 
          l.domain === domain && l.moduleId === module && l.lessonId === lessonId
        )
        
        if (lessonData) {
          // Merge path-based metadata with existing metadata (preserves thumbnail)
          metadata = {
            ...metadata, // Preserve thumbnailUrl, thumbnailType, keyTakeaways, etc.
            domain,
            module,
            lesson_number: lessonData.lessonNumber,
            module_number: lessonData.moduleNumber,
            domain_title: lessonData.domainTitle,
            module_title: lessonData.moduleTitle,
          }
        }
      }

      return {
        title: lesson.title,
        content: lesson.content,
        competencyId: lesson.competencyId,
        status: lesson.status || 'draft',
        storagePath,
        metadata,
        description: lesson.metadata?.keyTakeaways?.join(' ') || lesson.title,
      }
    })

    bulkSaveMutation.mutate(articlesToInsert)
  }

  const toggleLessonSelection = (lessonPath: string) => {
    const newSelection = new Set(selectedLessons)
    if (newSelection.has(lessonPath)) {
      newSelection.delete(lessonPath)
    } else {
      newSelection.add(lessonPath)
    }
    setSelectedLessons(newSelection)
  }

  const selectAllFilteredLessons = () => {
    const paths = new Set(filteredLessons.map(l => `${l.domain}/${l.moduleId}/${l.lessonId}`))
    setSelectedLessons(paths)
  }

  const deselectAllLessons = () => {
    setSelectedLessons(new Set())
  }

  const selectOnlyMissing = () => {
    const missingPaths = filteredLessons
      .filter(l => {
        const path = `${l.domain}/${l.moduleId}/${l.lessonId}`
        return !existingArticles.has(path)
      })
      .map(l => `${l.domain}/${l.moduleId}/${l.lessonId}`)
    setSelectedLessons(new Set(missingPaths))
  }

  const exportResults = () => {
    if (progress.results.length === 0) return

    const exportData = {
      generatedAt: new Date().toISOString(),
      config,
      lessons: progress.results
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `capital-allocation-curriculum-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const regenerateThumbnail = async (lesson: any, index: number) => {
    try {
      const lessonItem = progress.results[index] as any
      // Get domain information from original lesson data
      const originalLesson = allLessons.find(l => `${l.domain}/${l.moduleId}/${l.lessonId}` === lessonItem.lessonPath)
      const domainTitle = originalLesson?.domainTitle || lessonItem.metadata?.domain_title || 'Business Strategy'

      const response = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonItem.title,
          domainName: domainTitle,
          contentType: 'lesson',
          description: lessonItem.metadata?.keyTakeaways?.join(' ') || undefined,
          useImagen: true, // Use Imagen generation
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail')
      }

      const thumbnailData = await response.json()

      // Update the lesson in results
      const updatedResults = [...progress.results]
      const currentMetadata = lessonItem.metadata || {
        moduleNumber: lessonItem.moduleNumber || 0,
        lessonNumber: lessonItem.lessonNumber || 0,
        estimatedReadingTime: lessonItem.estimatedReadingTime || 0,
        keyTakeaways: lessonItem.keyTakeaways || [],
        visualizations: lessonItem.visualizations || [],
      }

      // Handle both PNG (Imagen) and SVG (fallback) responses
      const metadataWithThumbnail = {
        ...currentMetadata,
        ...(thumbnailData.type === 'png' 
          ? {
              thumbnailUrl: thumbnailData.imageBuffer || thumbnailData.url,
              thumbnailType: 'png',
            }
          : {
              thumbnailSvg: thumbnailData.svg,
              thumbnailUrl: `data:image/svg+xml;base64,${btoa(thumbnailData.svg)}`,
              thumbnailType: 'svg',
            }
        ),
      } as any

      updatedResults[index].metadata = metadataWithThumbnail

      setProgress(prev => ({
        ...prev,
        results: updatedResults
      }))

      toast.success('Thumbnail regenerated successfully!')
    } catch (error) {
      console.error('Error regenerating thumbnail:', error)
      toast.error('Failed to regenerate thumbnail')
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configure" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="select" className="flex items-center gap-2">
            <Circle className="w-4 h-4" />
            Select Lessons
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
              <CardDescription>Configure your AI provider and model settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">AI Provider</Label>
                  <Select value={config.provider} onValueChange={(value: 'openai' | 'gemini') => 
                    setConfig(prev => ({ ...prev, provider: value }))
                  }>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={config.model} onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, model: value }))
                  }>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.provider === 'openai' 
                        ? Object.entries(DEFAULT_MODELS.openai).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))
                        : Object.entries(DEFAULT_MODELS.gemini).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* API Key Status */}
              <div>
                <Label>API Key Configuration</Label>
                <div className="mt-1 space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${apiKeysConfigured?.openai ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">OpenAI</span>
                    </div>
                    {apiKeysConfigured?.openai ? (
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-red-700 border-red-300">
                        Not Configured
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${apiKeysConfigured?.gemini ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">Google Gemini</span>
                    </div>
                    {apiKeysConfigured?.gemini ? (
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-red-700 border-red-300">
                        Not Configured
                      </Badge>
                    )}
                  </div>
                  {(!apiKeysConfigured?.openai && !apiKeysConfigured?.gemini) && (
                    <p className="text-xs text-gray-500 mt-2">
                      API keys should be set in environment variables: <code className="bg-gray-100 px-1 rounded">OPENAI_API_KEY</code> or <code className="bg-gray-100 px-1 rounded">GEMINI_API_KEY</code>
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Competencies are automatically resolved from lesson metadata (domain, module, lesson). 
                  Each lesson will be assigned to its corresponding competency based on the curriculum structure.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>Customize the generated content format and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wordcount">Target Word Count</Label>
                  <Input
                    id="wordcount"
                    type="number"
                    value={config.targetWordCount}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      targetWordCount: parseInt(e.target.value) || 2500 
                    }))}
                    min={1000}
                    max={5000}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">2-3 A4 pages (1000-5000 words)</p>
                </div>

                <div>
                  <Label htmlFor="tone">Content Tone</Label>
                  <Select value={config.tone} onValueChange={(value: 'professional' | 'academic' | 'conversational') => 
                    setConfig(prev => ({ ...prev, tone: value }))
                  }>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Data Visualizations</Label>
                    <p className="text-xs text-gray-500">Tables, charts, and data comparisons</p>
                  </div>
                  <Switch
                    checked={config.includeVisualizations}
                    onCheckedChange={(checked) => setConfig(prev => ({ 
                      ...prev, 
                      includeVisualizations: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Mermaid Diagrams</Label>
                    <p className="text-xs text-gray-500">Flowcharts, process diagrams, and decision trees</p>
                  </div>
                  <Switch
                    checked={config.includeMermaidDiagrams}
                    onCheckedChange={(checked) => setConfig(prev => ({ 
                      ...prev, 
                      includeMermaidDiagrams: checked 
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                <div className="space-y-0.5">
                  <Label htmlFor="skipThumbnail" className="text-sm font-medium">
                    Skip Thumbnail Generation
                  </Label>
                  <p className="text-xs text-gray-500">
                    Skip generating thumbnails to speed up generation
                  </p>
                </div>
                <Switch
                  id="skipThumbnail"
                  checked={skipThumbnail}
                  onCheckedChange={setSkipThumbnail}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lesson Selection Tab */}
        <TabsContent value="select" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle>Select Lessons to Generate</CardTitle>
                  <CardDescription>
                    Choose from all {allLessons.length} lessons across {completeCurriculumData.length} domains
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllFilteredLessons}>
                    Select All ({filteredLessons.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectOnlyMissing}>
                    Select Missing Only
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllLessons}>
                    Deselect All
                  </Button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label htmlFor="domain-filter">Filter by Domain</Label>
                  <Select value={lessonDomainFilter} onValueChange={setLessonDomainFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      {completeCurriculumData.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lesson-search">Search Lessons</Label>
                  <Input
                    id="lesson-search"
                    type="text"
                    value={lessonSearchFilter}
                    onChange={(e) => setLessonSearchFilter(e.target.value)}
                    placeholder="Search by title, module, or domain..."
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
                      Show only missing lessons
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingArticles ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">Loading lesson status...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {Object.entries(lessonsByDomain).map(([domainId, { domainTitle, lessons }]) => {
                      // Group lessons by module within domain
                      const lessonsByModule = lessons.reduce((acc, lesson) => {
                        if (!acc[lesson.moduleId]) {
                          acc[lesson.moduleId] = {
                            moduleTitle: lesson.moduleTitle,
                            moduleNumber: lesson.moduleNumber,
                            lessons: []
                          }
                        }
                        acc[lesson.moduleId].lessons.push(lesson)
                        return acc
                      }, {} as Record<string, { moduleTitle: string; moduleNumber: number; lessons: typeof lessons }>)

                      return (
                        <div key={domainId} className="border-l-4 border-l-blue-500 pl-4">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {domainTitle}
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({lessons.length} lesson{lessons.length !== 1 ? 's' : ''})
                            </span>
                          </h3>
                          
                          <div className="space-y-4">
                            {Object.entries(lessonsByModule)
                              .sort(([, a], [, b]) => a.moduleNumber - b.moduleNumber)
                              .map(([moduleId, { moduleTitle, moduleNumber, lessons: moduleLessons }]) => (
                                <Card key={moduleId} className="border border-gray-200">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                      Module {moduleNumber}: {moduleTitle}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      {moduleLessons.map((lesson) => {
                                        const lessonPath = `${lesson.domain}/${lesson.moduleId}/${lesson.lessonId}`
                                        const exists = existingArticles.has(lessonPath)
                                        const isSelected = selectedLessons.has(lessonPath)
                                        
                                        return (
                                          <div
                                            key={lessonPath}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                              isSelected
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                            onClick={() => toggleLessonSelection(lessonPath)}
                                          >
                                            {isSelected ? (
                                              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            ) : (
                                              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <h4 className="font-medium text-sm">
                                                    Lesson {lesson.moduleNumber}.{lesson.lessonNumber}: {lesson.lessonTitle}
                                                  </h4>
                                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{lesson.description}</p>
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
                      )
                    })}
                  </div>
                  
                  {filteredLessons.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600">No lessons match your filters</p>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">
                          {selectedLessons.size} lesson{selectedLessons.size !== 1 ? 's' : ''} selected
                          {filteredLessons.length < allLessons.length && (
                            <span className="text-sm font-normal text-blue-700 ml-2">
                              ({filteredLessons.length} shown)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-blue-700">
                          Estimated generation time: {Math.ceil(selectedLessons.size * 2)} minutes
                        </p>
                      </div>
                      <Badge variant="secondary">
                        ~{(selectedLessons.size * config.targetWordCount).toLocaleString()} words
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Content</CardTitle>
              <CardDescription>Start the AI content generation process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!progress.isGenerating && progress.results.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedLessons.size} lessons selected for generation
                  </p>
                  <div className="space-y-3">
                    {(!apiKeysConfigured?.openai && config.provider === 'openai') && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ OpenAI API key is not configured. Please set <code className="bg-yellow-100 px-1 rounded">OPENAI_API_KEY</code> in your environment variables.
                        </p>
                      </div>
                    )}
                    {(!apiKeysConfigured?.gemini && config.provider === 'gemini') && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Gemini API key is not configured. Please set <code className="bg-yellow-100 px-1 rounded">GEMINI_API_KEY</code> in your environment variables.
                        </p>
                      </div>
                    )}
                    <Button 
                      onClick={handleGenerateSelected}
                      disabled={
                        (config.provider === 'openai' && !apiKeysConfigured?.openai) ||
                        (config.provider === 'gemini' && !apiKeysConfigured?.gemini) ||
                        selectedLessons.size === 0
                      }
                      size="lg"
                      className="flex items-center gap-2 w-full"
                    >
                      <Play className="w-4 h-4" />
                      Start Generation
                    </Button>
                  </div>
                </div>
              )}

              {progress.isGenerating && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Generating Content...</h3>
                    <p className="text-gray-600">
                      {progress.currentLesson || 'Preparing...'}
                    </p>
                  </div>
                  
                  <Progress 
                    value={(progress.completed / progress.total) * 100} 
                    className="w-full"
                  />
                  
                  <div className="text-center text-sm text-gray-500">
                    {progress.completed} of {progress.total} lessons completed
                  </div>
                </div>
              )}

              {progress.results.length > 0 && !progress.isGenerating && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Generation Complete!</h3>
                  <p className="text-gray-600 mb-4">
                    Successfully generated {progress.results.length} lessons
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={handleSaveToDatabase} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Save to Database
                    </Button>
                    <Button variant="outline" onClick={exportResults} className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export JSON
                    </Button>
                  </div>
                </div>
              )}

              {progress.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Generation Errors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {progress.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {progress.results.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-600">Generate some content to see results here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Results List */}
              <Card>
                <CardHeader>
                  <CardTitle>Generated Lessons ({progress.results.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {progress.results.map((lesson, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-colors ${
                          previewLesson === lesson
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            {(lesson.metadata as any)?.thumbnailUrl ? (
                              <img
                                src={(lesson.metadata as any).thumbnailUrl}
                                alt={lesson.title}
                                className="w-[75px] h-[100px] object-cover border border-gray-300 rounded"
                              />
                            ) : (
                              <div className="w-[75px] h-[100px] bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-400">No thumbnail</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 
                              className="font-medium text-sm cursor-pointer"
                              onClick={() => setPreviewLesson(lesson)}
                            >
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {lesson.metadata?.estimatedReadingTime || 'N/A'} min read
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Module {lesson.metadata?.moduleNumber || 'N/A'}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                regenerateThumbnail(lesson, index)
                              }}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Regenerate Thumbnail
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  {previewLesson && (
                    <CardDescription>{previewLesson.title}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {previewLesson ? (
                    <div className="max-h-96 overflow-y-auto">
                      <MarkdownRenderer content={previewLesson.content} />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Select a lesson to preview
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
