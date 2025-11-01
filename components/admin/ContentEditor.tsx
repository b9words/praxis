'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ErrorState from '@/components/ui/error-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingState } from '@/components/ui/loading-skeleton'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { fetchJson } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface ContentEditorProps {
  contentType: 'article' | 'case'
  mode: 'create' | 'edit'
  contentId?: string
}

export default function ContentEditor({ contentType, mode, contentId }: ContentEditorProps) {
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

  // Fetch competencies
  const { data: competenciesData } = useQuery({
    queryKey: queryKeys.competencies.all(),
    queryFn: ({ signal }) => fetchJson<{ competencies: any[] }>('/api/competencies', { signal }),
  })

  const competencies = competenciesData?.competencies || []

  // Fetch content in edit mode
  const { data: contentData, isLoading: loading } = useQuery({
    queryKey: contentType === 'article' 
      ? queryKeys.articles.all()
      : ['cases', contentId],
    queryFn: ({ signal }) => 
      contentType === 'article'
        ? fetchJson<{ article: any }>(`/api/articles/${contentId}`, { signal })
        : fetchJson<{ case: any }>(`/api/cases/${contentId}`, { signal }),
    enabled: mode === 'edit' && !!contentId,
    onSuccess: (data) => {
      if (contentType === 'article' && 'article' in data) {
        const article = data.article
        setTitle(article.title)
        setCompetencyId(article.competencyId)
        setContent(article.content || '')
        setStatus(article.status)
      } else if ('case' in data) {
        const caseItem = data.case
        setTitle(caseItem.title)
        setBriefingDoc(caseItem.briefingDoc || '')
        setDatasets(caseItem.datasets ? JSON.stringify(caseItem.datasets, null, 2) : '')
        setRubric(caseItem.rubric ? JSON.stringify(caseItem.rubric, null, 2) : '')
        setStatus(caseItem.status)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load content')
      router.push('/admin/content')
    },
  })

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (contentType === 'article') {
        if (!title || !competencyId || !content) {
          throw new Error('Please fill in all required fields')
        }

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

        if (datasets) {
          try {
            parsedDatasets = JSON.parse(datasets)
          } catch (e) {
            throw new Error('Invalid JSON in datasets field')
          }
        }

        try {
          parsedRubric = JSON.parse(rubric)
        } catch (e) {
          throw new Error('Invalid JSON in rubric field')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all() })
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      toast.success(`${contentType === 'article' ? 'Article' : 'Case'} ${mode === 'create' ? 'created' : 'updated'} successfully`)
      router.push('/admin/content')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save content')
    },
  })

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'Create' : 'Edit'} {contentType === 'article' ? 'Article' : 'Case'}
          </h1>
          <p className="mt-2 text-gray-600">
            {contentType === 'article' ? 'Add content to the competency library' : 'Create a business case simulation'}
          </p>
        </div>
      </div>

      {/* Common Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              className="mt-1"
              required
            />
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
              <Label htmlFor="competency">Competency *</Label>
              <Select value={competencyId} onValueChange={setCompetencyId}>
                <SelectTrigger className="mt-1">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Fields */}
      {contentType === 'article' ? (
        <Card>
          <CardHeader>
            <CardTitle>Article Content</CardTitle>
            <CardDescription>Write your article in Markdown format</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="# Your Article Title&#10;&#10;Write your content here..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-4">
                <div className="border border-neutral-200 rounded-lg p-6 bg-white">
                  <MarkdownRenderer content={content} />
                </div>
              </TabsContent>
            </Tabs>
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
              <Tabs defaultValue="edit" className="w-full">
                <TabsList>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-4">
                  <Textarea
                    value={briefingDoc}
                    onChange={(e) => setBriefingDoc(e.target.value)}
                    placeholder="#### The Scenario&#10;&#10;Describe the business situation..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <div className="border border-neutral-200 rounded-lg p-6 bg-white">
                    <MarkdownRenderer content={briefingDoc} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datasets (JSON)</CardTitle>
              <CardDescription>Financial data, metrics, and other structured information</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={datasets}
                onChange={(e) => setDatasets(e.target.value)}
                placeholder='{ "financials": { "revenue": 10000000 } }'
                rows={10}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rubric (JSON) *</CardTitle>
              <CardDescription>The evaluation criteria for the AI Coach</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder='{ "criteria": [{ "competencyName": "Financial Acumen", "description": "...", "scoringGuide": { "1": "...", "3": "...", "5": "..." } }] }'
                rows={15}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/content')}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

