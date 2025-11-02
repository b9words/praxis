'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchJson } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle, Circle, FileText, Play, RefreshCw, Settings, Sparkles, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ManifestFile {
  fileId: string
  fileName: string
  fileType: string
  sourcingGuide: string
  synthesisInstruction: string
}

interface Manifest {
  caseId: string
  topic: string
  files: ManifestFile[]
}

export default function CaseStudyGenerator() {
  const [topic, setTopic] = useState('')
  const [caseId, setCaseId] = useState('')
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [activeTab, setActiveTab] = useState('phase1')
  const [caseData, setCaseData] = useState<any>(null)

  // Phase 1: Generate manifest
  const manifestMutation = useMutation({
    mutationFn: (data: { topic: string; caseId: string }) =>
      fetchJson<{ success: boolean; manifest: Manifest; manifestPath: string }>(
        '/api/case-studies/generate/manifest',
        {
          method: 'POST',
          body: data,
        }
      ),
    onSuccess: (data) => {
      setManifest(data.manifest)
      setActiveTab('phase2')
      toast.success('Manifest generated successfully!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to generate manifest')
    },
  })

  // Phase 3: Assemble case
  const assembleMutation = useMutation({
    mutationFn: (data: { caseId: string }) =>
      fetchJson<{ success: boolean; caseId: string; outputPath: string; caseData?: any; thumbnailUrl?: string }>(
        '/api/case-studies/generate/assemble',
        {
          method: 'POST',
          body: data,
        }
      ),
    onSuccess: (data) => {
      toast.success(`Case study assembled! Saved to ${data.outputPath}`)
      if (data.caseData) {
        setCaseData(data.caseData)
      }
      setActiveTab('complete')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to assemble case')
    },
  })

  const handleGenerateManifest = () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    const id = caseId.trim() || `cs_${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
    setCaseId(id)
    manifestMutation.mutate({ topic: topic.trim(), caseId: id })
  }

  const handleAssembleCase = () => {
    if (!manifest) {
      toast.error('Please generate a manifest first')
      return
    }
    assembleMutation.mutate({ caseId: manifest.caseId })
  }

  const regenerateThumbnail = async () => {
    if (!caseData || !caseData.title) {
      toast.error('No case data available')
      return
    }

    try {
      // Get domain from competencies
      const competencyNames = Array.isArray(caseData.competencies) ? caseData.competencies : []
      const competencyName = competencyNames[0] || 'Business Strategy'
      
      const domainMapping: Record<string, string> = {
        'financial': 'Financial Acumen',
        'strategic': 'Strategic Thinking',
        'market': 'Market Awareness',
        'risk': 'Risk Management',
        'leadership': 'Leadership Judgment',
      }
      
      const domainName = Object.entries(domainMapping).find(([key]) => 
        competencyName.toLowerCase().includes(key)
      )?.[1] || competencyName || 'Business Strategy'

      const response = await fetch('/api/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: caseData.title,
          domainName: domainName,
          contentType: 'case',
          description: caseData.description,
          useImagen: true, // Use Imagen generation
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail')
      }

      const thumbnailData = await response.json()

      // Update case data - handle both PNG (Imagen) and SVG (fallback)
      const updatedCaseData: any = {
        ...caseData,
      }

      if (thumbnailData.type === 'png') {
        updatedCaseData.thumbnailUrl = thumbnailData.imageBuffer || thumbnailData.url
        updatedCaseData.thumbnailType = 'png'
      } else {
        const svg = thumbnailData.svg
        updatedCaseData.thumbnailSvg = svg
        updatedCaseData.thumbnailUrl = `data:image/svg+xml;base64,${btoa(svg)}`
        updatedCaseData.thumbnailType = 'svg'
      }

      setCaseData(updatedCaseData)

      toast.success('Thumbnail regenerated successfully!')
    } catch (error) {
      console.error('Error regenerating thumbnail:', error)
      toast.error('Failed to regenerate thumbnail')
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="phase1" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Phase 1: Manifest
          </TabsTrigger>
          <TabsTrigger value="phase2" disabled={!manifest} className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Phase 2: Source Files
          </TabsTrigger>
          <TabsTrigger value="phase3" disabled={!manifest} className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Phase 3: Assemble
          </TabsTrigger>
          <TabsTrigger value="complete" disabled={!assembleMutation.isSuccess} className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Complete
          </TabsTrigger>
        </TabsList>

        {/* Phase 1: Generate Manifest */}
        <TabsContent value="phase1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phase 1: Generate Case File Manifest</CardTitle>
              <CardDescription>
                Create a detailed manifest of evidence files needed for your case study
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topic">Case Study Topic *</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Disney's 2017 Streaming Pivot"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe the business decision or situation for this case study
                </p>
              </div>

              <div>
                <Label htmlFor="caseId">Case ID (optional)</Label>
                <Input
                  id="caseId"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier for this case (e.g., cs_disney_streaming_pivot)
                </p>
              </div>

              <Button
                onClick={handleGenerateManifest}
                disabled={!topic.trim() || manifestMutation.isPending}
                className="w-full"
                size="lg"
              >
                {manifestMutation.isPending ? (
                  <>
                    <Circle className="w-4 h-4 mr-2 animate-spin" />
                    Generating Manifest...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Manifest
                  </>
                )}
              </Button>

              {manifestMutation.isError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-red-700">
                      {manifestMutation.error instanceof Error
                        ? manifestMutation.error.message
                        : 'Failed to generate manifest'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phase 2: Manual Source File Upload */}
        <TabsContent value="phase2" className="space-y-6">
          {manifest && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Phase 2: Source Evidence Files</CardTitle>
                  <CardDescription>
                    Follow the manifest instructions to gather and upload evidence files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Manifest Generated</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Topic: <strong>{manifest.topic}</strong>
                    </p>
                    <p className="text-sm text-blue-700">
                      Case ID: <code className="bg-blue-100 px-1 rounded">{manifest.caseId}</code>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Required Files ({manifest.files.length})</h4>
                    {manifest.files.map((file, index) => (
                      <Card key={file.fileId} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                File {index + 1}: {file.fileName}
                              </CardTitle>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {file.fileType.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Sourcing Guide:
                            </Label>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                              {file.sourcingGuide}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Synthesis Instruction:
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">{file.synthesisInstruction}</p>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500">
                              Save to: <code>content/sources/{manifest.caseId}/{file.fileName}</code>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Manual Upload Required
                    </h4>
                    <p className="text-sm text-yellow-700">
                      After gathering all files according to the guides above, upload them to:{' '}
                      <code className="bg-yellow-100 px-1 rounded">
                        execemy/content/sources/{manifest.caseId}/
                      </code>
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      Once all files are uploaded, proceed to Phase 3 to assemble the case study.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('phase1')}>
                      Back
                    </Button>
                    <Button
                      onClick={() => setActiveTab('phase3')}
                      disabled={assembleMutation.isPending}
                      className="flex-1"
                    >
                      Proceed to Phase 3
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Phase 3: Assemble Case */}
        <TabsContent value="phase3" className="space-y-6">
          {manifest && (
            <Card>
              <CardHeader>
                <CardTitle>Phase 3: Assemble Case Study</CardTitle>
                <CardDescription>
                  AI will synthesize the manifest and source files into a complete case study
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    This will read all files from{' '}
                    <code className="bg-gray-100 px-1 rounded">
                      content/sources/{manifest.caseId}/
                    </code>{' '}
                    and generate a complete case study JSON.
                  </p>
                </div>

                {assembleMutation.isPending && (
                  <div className="space-y-2">
                    <Progress value={50} className="w-full" />
                    <p className="text-sm text-gray-600 text-center">
                      Assembling case study...
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab('phase2')}>
                    Back
                  </Button>
                  <Button
                    onClick={handleAssembleCase}
                    disabled={assembleMutation.isPending || assembleMutation.isSuccess}
                    className="flex-1"
                    size="lg"
                  >
                    {assembleMutation.isPending ? (
                      <>
                        <Circle className="w-4 h-4 mr-2 animate-spin" />
                        Assembling...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Assemble Case Study
                      </>
                    )}
                  </Button>
                </div>

                {assembleMutation.isError && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-red-700">
                        {assembleMutation.error instanceof Error
                          ? assembleMutation.error.message
                          : 'Failed to assemble case'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Complete */}
        <TabsContent value="complete" className="space-y-6">
          {assembleMutation.isSuccess && caseData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Case Study Assembled!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    Case study has been successfully assembled and saved.
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Output: <code className="bg-green-100 px-1 rounded">
                      {assembleMutation.data.outputPath}
                    </code>
                  </p>
                </div>

                {/* Thumbnail Display */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {caseData.thumbnailUrl ? (
                        <img
                          src={caseData.thumbnailUrl}
                          alt={caseData.title}
                          className="w-[75px] h-[100px] object-cover border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="w-[75px] h-[100px] bg-gray-200 border border-gray-300 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-400">No thumbnail</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-1">{caseData.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{caseData.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={regenerateThumbnail}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Regenerate Thumbnail
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTopic('')
                      setCaseId('')
                      setManifest(null)
                      setCaseData(null)
                      setActiveTab('phase1')
                      assembleMutation.reset()
                    }}
                  >
                    Start New Case
                  </Button>
                  <Button asChild className="flex-1">
                    <a href="/admin/content">View in Content Management</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

