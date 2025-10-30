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
import { ContentGenerator, DEFAULT_MODELS, GeneratedLesson, GenerationOptions, LessonStructure } from '@/lib/content-generator'
import { getAllLessonsFlat } from '@/lib/curriculum-data'
import { createClient } from '@/lib/supabase/client'
import { TokenTracker } from '@/lib/token-tracker'
import { CheckCircle, Circle, Download, Eye, Play, Settings, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface CurriculumGeneratorProps {
  competencies: any[]
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
  const supabase = createClient()
  
  // Generator instance
  const [generator, setGenerator] = useState<ContentGenerator | null>(null)
  const [curriculum, setCurriculum] = useState<LessonStructure[]>([])
  const [tokenTracker, setTokenTracker] = useState<TokenTracker | null>(null)
  const [dailyUsage, setDailyUsage] = useState<any[]>([])
  
  // Configuration
  const [config, setConfig] = useState<GenerationOptions>({
    provider: 'openai',
    model: 'gpt-4o-mini', // Default to mini model for higher token limit
    includeVisualizations: true,
    includeMermaidDiagrams: true,
    targetWordCount: 2500,
    tone: 'professional'
  })

  // Get all lessons from the new curriculum structure
  const allLessons = getAllLessonsFlat()
  
  // API Keys
  const [openaiKey, setOpenaiKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [selectedCompetency, setSelectedCompetency] = useState('')
  
  // Generation state
  const [progress, setProgress] = useState<GenerationProgress>({
    isGenerating: false,
    currentLesson: '',
    completed: 0,
    total: 0,
    results: [],
    errors: []
  })
  
  // UI state
  const [selectedLessons, setSelectedLessons] = useState<Set<number>>(new Set())
  const [previewLesson, setPreviewLesson] = useState<GeneratedLesson | null>(null)

  useEffect(() => {
    // Initialize generator and curriculum
    const gen = new ContentGenerator()
    setGenerator(gen)
    setCurriculum(gen.getCurriculum())
    
    // Initialize token tracker
    const tracker = new TokenTracker()
    setTokenTracker(tracker)
    
    // Load today's usage
    const loadUsage = async () => {
      const today = new Date().toISOString().split('T')[0]
      const usage = await tracker.getAllDailyUsage(today)
      setDailyUsage(usage)
    }
    loadUsage()
    
    // Select all lessons by default
    const allIndices = gen.getCurriculum().map((_, index) => index)
    setSelectedLessons(new Set(allIndices))
  }, [])

  const handleGenerateSelected = async () => {
    if (!generator || !openaiKey || !selectedCompetency) {
      toast.error('Please provide API key and select competency')
      return
    }

    const selectedLessonStructures = curriculum.filter((_, index) => selectedLessons.has(index))
    
    if (selectedLessonStructures.length === 0) {
      toast.error('Please select at least one lesson to generate')
      return
    }

    // Initialize generator with API keys
    const gen = new ContentGenerator(
      config.provider === 'openai' ? openaiKey : undefined,
      config.provider === 'gemini' ? geminiKey : undefined
    )

    setProgress({
      isGenerating: true,
      currentLesson: '',
      completed: 0,
      total: selectedLessonStructures.length,
      results: [],
      errors: []
    })

    try {
      const results = await gen.generateBatchLessons(
        selectedLessonStructures,
        config,
        selectedCompetency,
        (completed, total, currentLesson) => {
          setProgress(prev => ({
            ...prev,
            completed,
            total,
            currentLesson
          }))
        }
      )

      setProgress(prev => ({
        ...prev,
        isGenerating: false,
        results,
        currentLesson: 'Complete'
      }))

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

  const handleSaveToDatabase = async () => {
    if (progress.results.length === 0) {
      toast.error('No generated content to save')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const articlesToInsert = progress.results.map(lesson => ({
        title: lesson.title,
        content: lesson.content,
        competency_id: lesson.competencyId,
        status: lesson.status,
        created_by: user.id,
        updated_by: user.id
      }))

      const { error } = await supabase
        .from('articles')
        .insert(articlesToInsert)

      if (error) throw error

      toast.success(`Saved ${progress.results.length} lessons to database!`)
      
      // Clear results after saving
      setProgress(prev => ({ ...prev, results: [] }))
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save to database')
    }
  }

  const toggleLessonSelection = (index: number) => {
    const newSelection = new Set(selectedLessons)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedLessons(newSelection)
  }

  const selectAllLessons = () => {
    setSelectedLessons(new Set(curriculum.map((_, index) => index)))
  }

  const deselectAllLessons = () => {
    setSelectedLessons(new Set())
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

              <div>
                <Label htmlFor="apikey">
                  {config.provider === 'openai' ? 'OpenAI API Key' : 'Gemini API Key'}
                </Label>
                <Input
                  id="apikey"
                  type="password"
                  value={config.provider === 'openai' ? openaiKey : geminiKey}
                  onChange={(e) => config.provider === 'openai' 
                    ? setOpenaiKey(e.target.value) 
                    : setGeminiKey(e.target.value)
                  }
                  placeholder={`Enter your ${config.provider === 'openai' ? 'OpenAI' : 'Gemini'} API key`}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="competency">Target Competency</Label>
                <Select value={selectedCompetency} onValueChange={setSelectedCompetency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select competency for generated content" />
                  </SelectTrigger>
                  <SelectContent>
                    {competencies.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lesson Selection Tab */}
        <TabsContent value="select" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Lessons to Generate</CardTitle>
                  <CardDescription>Choose which lessons from the Capital Allocation curriculum to generate</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllLessons}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllLessons}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {curriculum.reduce((acc, lesson, index) => {
                  const moduleIndex = acc.findIndex(m => m.moduleNumber === lesson.moduleNumber)
                  if (moduleIndex === -1) {
                    acc.push({
                      moduleNumber: lesson.moduleNumber,
                      moduleName: lesson.moduleName,
                      lessons: [{ ...lesson, index }]
                    })
                  } else {
                    acc[moduleIndex].lessons.push({ ...lesson, index })
                  }
                  return acc
                }, [] as Array<{ moduleNumber: number; moduleName: string; lessons: Array<LessonStructure & { index: number }> }>).map((module) => (
                  <Card key={module.moduleNumber} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Module {module.moduleNumber}: {module.moduleName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.index}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedLessons.has(lesson.index)
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => toggleLessonSelection(lesson.index)}
                          >
                            {selectedLessons.has(lesson.index) ? (
                              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                Lesson {lesson.moduleNumber}.{lesson.lessonNumber}: {lesson.lessonName}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">{lesson.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">
                      {selectedLessons.size} lessons selected
                    </p>
                    <p className="text-sm text-blue-700">
                      Estimated generation time: {Math.ceil(selectedLessons.size * 2)} minutes
                    </p>
                  </div>
                  <Badge variant="secondary">
                    ~{selectedLessons.size * config.targetWordCount} words
                  </Badge>
                </div>
              </div>
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
                  <Button 
                    onClick={handleGenerateSelected}
                    disabled={!openaiKey && !geminiKey || !selectedCompetency || selectedLessons.size === 0}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Generation
                  </Button>
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
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {progress.results.map((lesson, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          previewLesson === lesson
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => setPreviewLesson(lesson)}
                      >
                        <h4 className="font-medium text-sm">{lesson.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {lesson.metadata.estimatedReadingTime} min read
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Module {lesson.metadata.moduleNumber}
                          </Badge>
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
