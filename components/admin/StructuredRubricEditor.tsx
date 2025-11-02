'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Code, FileJson, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RubricCriterion {
  competencyName: string
  description: string
  scoringGuide: {
    '1': string
    '3': string
    '5': string
  }
}

interface StructuredRubricEditorProps {
  value: string // JSON string
  onChange: (value: string) => void
  competencies?: Array<{ id: string; name: string }>
}

export default function StructuredRubricEditor({
  value,
  onChange,
  competencies = [],
}: StructuredRubricEditorProps) {
  const [criteria, setCriteria] = useState<RubricCriterion[]>([])
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value)
        if (parsed.criteria && Array.isArray(parsed.criteria)) {
          setCriteria(parsed.criteria)
          setJsonError(null)
        } else {
          setCriteria([])
          setJsonError('Invalid rubric structure. Expected object with "criteria" array.')
        }
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : 'Invalid JSON')
        setCriteria([])
      }
    } else {
      setCriteria([])
    }
  }, [value])

  // Update JSON when criteria changes
  useEffect(() => {
    try {
      const rubric = { criteria }
      const jsonString = JSON.stringify(rubric, null, 2)
      onChange(jsonString)
      setJsonError(null)
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Failed to serialize rubric')
    }
  }, [criteria, onChange])

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        competencyName: '',
        description: '',
        scoringGuide: {
          '1': '',
          '3': '',
          '5': '',
        },
      },
    ])
  }

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index))
  }

  const updateCriterion = (index: number, field: keyof RubricCriterion, value: any) => {
    const updated = [...criteria]
    if (field === 'scoringGuide') {
      updated[index] = { ...updated[index], scoringGuide: { ...updated[index].scoringGuide, ...value } }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setCriteria(updated)
  }

  const updateScoringGuide = (index: number, score: '1' | '3' | '5', value: string) => {
    const updated = [...criteria]
    updated[index] = {
      ...updated[index],
      scoringGuide: {
        ...updated[index].scoringGuide,
        [score]: value,
      },
    }
    setCriteria(updated)
  }

  const isValid = criteria.every(
    (c) =>
      c.competencyName.trim() &&
      c.description.trim() &&
      c.scoringGuide['1'].trim() &&
      c.scoringGuide['3'].trim() &&
      c.scoringGuide['5'].trim()
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Rubric Criteria</h3>
          <p className="text-xs text-gray-500 mt-1">
            Define evaluation criteria with scoring guides (1 = Poor, 3 = Average, 5 = Excellent)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowRawJson(!showRawJson)}
          >
            {showRawJson ? <FileJson className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
            {showRawJson ? 'Form View' : 'JSON View'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
            <Plus className="h-4 w-4 mr-2" />
            Add Criterion
          </Button>
        </div>
      </div>

      {jsonError && (
        <Alert className="border-red-200 bg-red-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <AlertDescription className="text-red-800">{jsonError}</AlertDescription>
          </div>
        </Alert>
      )}

      {!isValid && criteria.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <AlertDescription className="text-amber-800">Please fill in all required fields for each criterion</AlertDescription>
          </div>
        </Alert>
      )}

      {showRawJson ? (
        <Tabs defaultValue="raw" className="w-full">
          <TabsList>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            <TabsTrigger value="formatted">Formatted</TabsTrigger>
          </TabsList>
          <TabsContent value="raw" className="mt-4">
            <Textarea
              value={value || '{}'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  if (parsed.criteria && Array.isArray(parsed.criteria)) {
                    setCriteria(parsed.criteria)
                    setJsonError(null)
                  } else {
                    setJsonError('Invalid rubric structure')
                  }
                } catch (err) {
                  setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
                }
                onChange(e.target.value)
              }}
              rows={20}
              className="font-mono text-sm"
              placeholder='{ "criteria": [...] }'
            />
          </TabsContent>
          <TabsContent value="formatted" className="mt-4">
            <pre className="border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-auto text-sm">
              {value || '{}'}
            </pre>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          {criteria.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <p className="text-sm text-gray-500 mb-4">No criteria defined yet</p>
              <Button type="button" variant="outline" onClick={addCriterion}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Criterion
              </Button>
            </div>
          ) : (
            criteria.map((criterion, index) => (
              <Card key={index} className="border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">Criterion {index + 1}</CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriterion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>
                      Competency Name *
                      {competencies.length > 0 && (
                        <span className="text-xs text-gray-500 ml-2">(or enter custom name)</span>
                      )}
                    </Label>
                    {competencies.length > 0 ? (
                      <Select
                        value={criterion.competencyName}
                        onValueChange={(val) => updateCriterion(index, 'competencyName', val)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select or type a competency" />
                        </SelectTrigger>
                        <SelectContent>
                          {competencies.map((comp) => (
                            <SelectItem key={comp.id} value={comp.name}>
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={criterion.competencyName}
                        onChange={(e) => updateCriterion(index, 'competencyName', e.target.value)}
                        placeholder="e.g., Financial Acumen"
                        className="mt-1"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      value={criterion.description}
                      onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                      placeholder="Evaluates the user's ability to..."
                      rows={3}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label>Scoring Guide *</Label>
                    <div className="mt-2 space-y-3">
                      <div>
                        <Label className="text-xs text-gray-600">Score 1 (Poor Performance)</Label>
                        <Textarea
                          value={criterion.scoringGuide['1']}
                          onChange={(e) => updateScoringGuide(index, '1', e.target.value)}
                          placeholder="Completely misapplied or failed to use the relevant framework..."
                          rows={2}
                          className="mt-1 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Score 3 (Average Performance)</Label>
                        <Textarea
                          value={criterion.scoringGuide['3']}
                          onChange={(e) => updateScoringGuide(index, '3', e.target.value)}
                          placeholder="Correctly applied the framework but missed key nuances..."
                          rows={2}
                          className="mt-1 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Score 5 (Excellent Performance)</Label>
                        <Textarea
                          value={criterion.scoringGuide['5']}
                          onChange={(e) => updateScoringGuide(index, '5', e.target.value)}
                          placeholder="Flawlessly applied the framework and used it to generate deep insights..."
                          rows={2}
                          className="mt-1 text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

