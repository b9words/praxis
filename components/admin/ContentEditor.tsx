'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ErrorState from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/ui/loading-skeleton'
import MarkdownRenderer from '@/components/ui/Markdown'
import RichMarkdownEditor from '@/components/admin/RichMarkdownEditor'
import StructuredRubricEditor from '@/components/admin/StructuredRubricEditor'
import StructuredJsonEditor from '@/components/admin/StructuredJsonEditor'
import FieldError from '@/components/admin/FieldError'
import HelpTooltip from '@/components/admin/HelpTooltip'
import { validateArticle, validateCase, getFieldError, hasFieldError } from '@/lib/admin/validation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'

interface ContentEditorProps {
  contentType: 'article' | 'case'
  mode: 'create' | 'edit'
  contentId?: string
  onClose?: () => void // Optional callback for modal close
}

export default function ContentEditor({ contentType, mode, contentId, onClose }: ContentEditorProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Common fields
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'draft' | 'in_review' | 'approved' | 'published'>('draft')
  
  // Article-specific fields
  const [competencyId, setCompetencyId] = useState('')
  const [content, setContent] = useState('')
  
  // Case-specific fields
  const [briefingDoc, setBriefingDoc] = useState('')
  const [datasets, setDatasets] = useState('')
  const [rubric, setRubric] = useState('')

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string }>>([])
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Fetch competencies
  const { data: competenciesData } = useQuery({
    queryKey: queryKeys.competencies.all(),
    queryFn: ({ signal }) => fetchJson<{ competencies: any[] }>('/api/competencies', { signal }),
  })

  const competencies = competenciesData?.competencies || []

  // Fetch content in edit mode
  const { data: contentData, isLoading: loading, error } = useQuery({
    queryKey: contentType === 'article' 
      ? [...queryKeys.articles.all(), contentId]
      : ['cases', contentId],
    queryFn: async ({ signal }) => 
      contentType === 'article'
        ? fetchJson<{ article: any }>(`/api/articles/${contentId}`, { signal })
        : fetchJson<{ case: any }>(`/api/cases/${contentId}`, { signal }),
    enabled: mode === 'edit' && !!contentId,
  })

  // Track if we've already loaded data to prevent re-processing
  const hasLoadedRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (contentData) {
      const data = contentData as any
      const dataKey = contentType === 'article' 
        ? `article-${data.article?.id || 'new'}`
        : `case-${data.case?.id || 'new'}`
      
      // Skip if we've already processed this data
      if (hasLoadedRef.current === dataKey) {
        return
      }
      
      if (contentType === 'article' && data.article) {
        const article = data.article as any
        setTitle(article.title || '')
        setCompetencyId(article.competencyId || '')
        setContent(article.content || '')
        setStatus(article.status || 'draft')
        hasLoadedRef.current = dataKey
      } else if (data.case) {
        const caseItem = data.case as any
        setTitle(caseItem.title || '')
        setBriefingDoc(caseItem.briefingDoc || '')
        
        // Handle datasets - could be object, string, or null
        if (caseItem.datasets) {
          try {
            let parsed: any
            if (typeof caseItem.datasets === 'string') {
              // If it's already a string, try to parse it first
              const trimmed = caseItem.datasets.trim()
              // Remove any leading non-JSON characters (like "1" or other prefixes)
              const jsonStart = trimmed.indexOf('{')
              if (jsonStart > 0) {
                parsed = JSON.parse(trimmed.substring(jsonStart))
              } else {
                parsed = JSON.parse(trimmed)
              }
            } else {
              // It's already an object
              parsed = caseItem.datasets
            }
            const datasetsStr = JSON.stringify(parsed, null, 2)
            // Only update if different to prevent loops
            setDatasets(prev => prev !== datasetsStr ? datasetsStr : prev)
          } catch (e) {
            // If parsing fails, use empty string
            console.warn('Failed to parse datasets:', e)
            setDatasets('')
          }
        } else {
          setDatasets('')
        }
        
        // Handle rubric - could be object, string, or null
        if (caseItem.rubric) {
          try {
            let parsed: any
            if (typeof caseItem.rubric === 'string') {
              // If it's already a string, try to parse it first
              const trimmed = caseItem.rubric.trim()
              // Remove any leading non-JSON characters
              const jsonStart = trimmed.indexOf('{')
              if (jsonStart > 0) {
                parsed = JSON.parse(trimmed.substring(jsonStart))
              } else {
                parsed = JSON.parse(trimmed)
              }
            } else {
              // It's already an object
              parsed = caseItem.rubric
            }
            const rubricStr = JSON.stringify(parsed, null, 2)
            // Only update if different to prevent loops
            setRubric(prev => prev !== rubricStr ? rubricStr : prev)
          } catch (e) {
            // If parsing fails, use empty string
            console.warn('Failed to parse rubric:', e)
            setRubric('')
          }
        } else {
          setRubric('')
        }
        
        setStatus(caseItem.status || 'draft')
        hasLoadedRef.current = dataKey
      }
    }
  }, [contentData, contentType])

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load content')
      router.push('/admin/content')
    }
  }, [error, router])

  // Validate before save
  const validate = () => {
    if (contentType === 'article') {
      const result = validateArticle({ title, competencyId, content, status })
      setValidationErrors(result.errors)
      return result.valid
    } else {
      const result = validateCase({ title, briefingDoc, rubric, datasets, status })
      setValidationErrors(result.errors)
      return result.valid
    }
  }

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate before save
      if (!validate()) {
        throw new Error('Please fix validation errors before saving')
      }

      if (contentType === 'article') {

        const articleData = {
          competencyId,
          title,
          content,
          status,
        }

        if (mode === 'create') {
          return fetchJson<{ article: any }>('/api/articles', {
            method: 'POST',
            body: articleData,
          })
        } else {
          return fetchJson<{ article: any }>(`/api/articles/${contentId}`, {
            method: 'PUT',
            body: articleData,
          })
        }
      } else {
        if (!title || !briefingDoc || !rubric) {
          throw new Error('Please fill in all required fields')
        }

        // Validate JSON fields
        let parsedDatasets = null
        let parsedRubric

        // Datasets is optional - only validate if provided and not empty
        if (datasets && datasets.trim()) {
          const trimmed = datasets.trim()
          // Skip validation if it's placeholder text
          const isPlaceholder = trimmed.includes('"financials"') && trimmed.includes('"revenue": 10000000')
          if (!isPlaceholder) {
            try {
              parsedDatasets = JSON.parse(trimmed)
            } catch (e) {
              const errorMsg = e instanceof Error ? e.message : 'Unknown error'
              // Extract position for better error message
              const positionMatch = errorMsg.match(/position (\d+)/)
              if (positionMatch) {
                const pos = parseInt(positionMatch[1], 10)
                const lines = trimmed.substring(0, pos).split('\n')
                const line = lines.length
                const col = lines[lines.length - 1].length + 1
                throw new Error(`Invalid JSON in datasets field at line ${line}, column ${col}: ${errorMsg}`)
              }
              throw new Error(`Invalid JSON in datasets field: ${errorMsg}`)
            }
          }
        }

        // Rubric is required
        if (!rubric || !rubric.trim()) {
          throw new Error('Rubric is required')
        }

        try {
          const trimmed = rubric.trim()
          parsedRubric = JSON.parse(trimmed)
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Unknown error'
          const positionMatch = errorMsg.match(/position (\d+)/)
          if (positionMatch) {
            const pos = parseInt(positionMatch[1], 10)
            const trimmed = rubric.trim()
            const lines = trimmed.substring(0, pos).split('\n')
            const line = lines.length
            const col = lines[lines.length - 1].length + 1
            throw new Error(`Invalid JSON in rubric field at line ${line}, column ${col}: ${errorMsg}`)
          }
          throw new Error(`Invalid JSON in rubric field: ${errorMsg}`)
        }

        const caseData = {
          title,
          briefingDoc,
          datasets: parsedDatasets,
          rubric: parsedRubric,
          status,
        }

        if (mode === 'create') {
          return fetchJson<{ case: any }>('/api/cases', {
            method: 'POST',
            body: caseData,
          })
        } else {
          return fetchJson<{ case: any }>(`/api/cases/${contentId}`, {
            method: 'PUT',
            body: caseData,
          })
        }
      }
    },
  })

  useEffect(() => {
    if (saveMutation.isSuccess) {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all() })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['admin-content'] })
      toast.success(`${contentType === 'article' ? 'Article' : 'Case'} ${mode === 'create' ? 'created' : 'updated'} successfully`)
      // Close modal if onClose callback provided, otherwise navigate
      if (onClose) {
        setTimeout(() => onClose(), 500)
      } else {
        import('@/lib/utils/redirect-helpers').then(({ safeRedirectAfterMutation }) => {
          safeRedirectAfterMutation(router, '/admin/content')
        })
      }
    }
    if (saveMutation.isError) {
      toast.error(saveMutation.error instanceof Error ? saveMutation.error.message : 'Failed to save content')
    }
  }, [saveMutation.isSuccess, saveMutation.isError, saveMutation.error, contentType, mode, queryClient, router, onClose])

  const handleSave = () => {
    saveMutation.mutate()
  }

  const saving = saveMutation.isPending

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <LoadingState type="dashboard" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
        <ErrorState
          title="Failed to load content"
          message="Unable to load the content editor. Please try again."
          error={error}
          onRetry={() => window.location.reload()}
          showBackToDashboard={true}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header - Compact for modal */}
      {!onClose && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'create' ? 'Create' : 'Edit'}{' '}
              <span suppressHydrationWarning>
                {contentType === 'article' ? 'Article' : 'Case'}
              </span>
            </h1>
            <p className="mt-2 text-gray-600">
              {contentType === 'article' ? 'Add content to the competency library' : 'Create a business case simulation'}
            </p>
          </div>
        </div>
      )}

      {/* Common Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="title">Title *</Label>
              <HelpTooltip content="A descriptive title that clearly indicates what this content is about. Should be at least 3 characters long." />
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setTouchedFields(new Set(touchedFields).add('title'))
              }}
              onBlur={() => {
                validate()
              }}
              placeholder="Enter a descriptive title"
              className={`mt-1 ${hasFieldError(validationErrors, 'title') ? 'border-red-500' : ''}`}
              required
            />
            {touchedFields.has('title') && <FieldError error={getFieldError(validationErrors, 'title')} />}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contentType === 'article' && (
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="competency">Competency *</Label>
                <HelpTooltip content="Select the competency this article teaches. This determines where it appears in the library." />
              </div>
              <Select
                value={competencyId}
                onValueChange={(val) => {
                  setCompetencyId(val)
                  setTouchedFields(new Set(touchedFields).add('competencyId'))
                  validate()
                }}
              >
                <SelectTrigger className={`mt-1 ${hasFieldError(validationErrors, 'competencyId') ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select a competency" />
                </SelectTrigger>
                <SelectContent>
                  {competencies.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touchedFields.has('competencyId') && <FieldError error={getFieldError(validationErrors, 'competencyId')} />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Fields */}
      {contentType === 'article' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Article Content</CardTitle>
              <HelpTooltip content="Write your article content in Markdown. Must be at least 100 characters. Use the toolbar for formatting help." />
            </div>
            <CardDescription>Write your article in Markdown format</CardDescription>
          </CardHeader>
          <CardContent>
            <RichMarkdownEditor
              value={content}
              onChange={(val) => {
                setContent(val)
                setTouchedFields(new Set(touchedFields).add('content'))
              }}
              placeholder="# Your Article Title\n\nWrite your content here..."
              minHeight="500px"
              onSave={handleSave}
              showPreview={true}
              autoSave={false}
            />
            {touchedFields.has('content') && <FieldError error={getFieldError(validationErrors, 'content')} />}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Case Briefing Document</CardTitle>
              <CardDescription>The main narrative of the case in Markdown</CardDescription>
            </CardHeader>
            <CardContent>
              <RichMarkdownEditor
                value={briefingDoc}
                onChange={setBriefingDoc}
                placeholder="#### The Scenario\n\nDescribe the business situation..."
                minHeight="400px"
                showPreview={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datasets (JSON)</CardTitle>
              <CardDescription>Financial data, metrics, and other structured information</CardDescription>
            </CardHeader>
            <CardContent>
              <StructuredJsonEditor
                value={datasets}
                onChange={setDatasets}
                placeholder='{\n  "financials": {\n    "revenue": 10000000,\n    "cogs": 4000000\n  }\n}'
                minHeight="250px"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rubric (JSON) *</CardTitle>
              <CardDescription>The evaluation criteria for the AI Coach</CardDescription>
            </CardHeader>
            <CardContent>
              <StructuredRubricEditor
                value={rubric}
                onChange={setRubric}
                competencies={competencies}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-900">Please fix the following errors:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
              {validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving || validationErrors.length > 0}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

