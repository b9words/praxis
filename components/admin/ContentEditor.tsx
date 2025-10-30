'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ContentEditorProps {
  contentType: 'article' | 'case'
  mode: 'create' | 'edit'
  contentId?: string
}

export default function ContentEditor({ contentType, mode, contentId }: ContentEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  
  // Common fields
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'draft' | 'in_review' | 'approved' | 'published'>('draft')
  
  // Article-specific fields
  const [competencyId, setCompetencyId] = useState('')
  const [content, setContent] = useState('')
  const [competencies, setCompetencies] = useState<any[]>([])
  
  // Case-specific fields
  const [briefingDoc, setBriefingDoc] = useState('')
  const [datasets, setDatasets] = useState('')
  const [rubric, setRubric] = useState('')

  useEffect(() => {
    async function loadData() {
      // Load competencies for article selector
      const { data: compData } = await supabase
        .from('competencies')
        .select('*')
        .order('name', { ascending: true })
      
      setCompetencies(compData || [])

      // Load existing content in edit mode
      if (mode === 'edit' && contentId) {
        if (contentType === 'article') {
          const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', contentId)
            .single()

          if (error || !data) {
            toast.error('Failed to load article')
            router.push('/admin/content')
            return
          }

          setTitle(data.title)
          setCompetencyId(data.competency_id)
          setContent(data.content)
          setStatus(data.status)
        } else {
          const { data, error } = await supabase
            .from('cases')
            .select('*')
            .eq('id', contentId)
            .single()

          if (error || !data) {
            toast.error('Failed to load case')
            router.push('/admin/content')
            return
          }

          setTitle(data.title)
          setBriefingDoc(data.briefing_doc)
          setDatasets(data.datasets ? JSON.stringify(data.datasets, null, 2) : '')
          setRubric(data.rubric ? JSON.stringify(data.rubric, null, 2) : '')
          setStatus(data.status)
        }
      }

      setLoading(false)
    }

    loadData()
  }, [mode, contentId, contentType, supabase, router])

  const handleSave = async () => {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (contentType === 'article') {
        if (!title || !competencyId || !content) {
          toast.error('Please fill in all required fields')
          setSaving(false)
          return
        }

        const articleData = {
          title,
          competency_id: competencyId,
          content,
          status,
          updated_by: user.id,
          ...(mode === 'create' ? { created_by: user.id } : {})
        }

        if (mode === 'create') {
          const { error } = await supabase
            .from('articles')
            .insert(articleData)

          if (error) throw error
          toast.success('Article created successfully')
        } else {
          const { error } = await supabase
            .from('articles')
            .update(articleData)
            .eq('id', contentId)

          if (error) throw error
          toast.success('Article updated successfully')
        }
      } else {
        // Case
        if (!title || !briefingDoc || !rubric) {
          toast.error('Please fill in all required fields')
          setSaving(false)
          return
        }

        // Validate JSON fields
        let parsedDatasets = null
        let parsedRubric

        if (datasets) {
          try {
            parsedDatasets = JSON.parse(datasets)
          } catch (e) {
            toast.error('Invalid JSON in datasets field')
            setSaving(false)
            return
          }
        }

        try {
          parsedRubric = JSON.parse(rubric)
        } catch (e) {
          toast.error('Invalid JSON in rubric field')
          setSaving(false)
          return
        }

        const caseData = {
          title,
          briefing_doc: briefingDoc,
          datasets: parsedDatasets,
          rubric: parsedRubric,
          status,
          updated_by: user.id,
          ...(mode === 'create' ? { created_by: user.id } : {})
        }

        if (mode === 'create') {
          const { error } = await supabase
            .from('cases')
            .insert(caseData)

          if (error) throw error
          toast.success('Case created successfully')
        } else {
          const { error } = await supabase
            .from('cases')
            .update(caseData)
            .eq('id', contentId)

          if (error) throw error
          toast.success('Case updated successfully')
        }
      }

      router.push('/admin/content')
    } catch (error: any) {
      console.error('Error saving content:', error)
      toast.error(error.message || 'Failed to save content')
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
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

