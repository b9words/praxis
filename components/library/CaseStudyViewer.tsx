'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Building2, CheckCircle, Clock, Target, TrendingUp } from 'lucide-react'
import { useState } from 'react'

interface CaseStudyData {
  id: string
  title: string
  company: string
  industry: string
  timeframe: string
  situation: string
  challenge: string
  actions: string[]
  results: {
    metric: string
    before: string
    after: string
    improvement: string
  }[]
  lessons: string[]
  keyTakeaways: string[]
  relatedConcepts: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedReadTime: number
}

interface CaseStudyViewerProps {
  caseStudy: CaseStudyData
  moduleTitle?: string
  domainTitle?: string
  onNext?: () => void
  onPrevious?: () => void
  className?: string
}

export default function CaseStudyViewer({ 
  caseStudy, 
  moduleTitle, 
  domainTitle,
  onNext, 
  onPrevious,
  className = '' 
}: CaseStudyViewerProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={`max-w-4xl ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            {(domainTitle || moduleTitle) && (
              <div className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wide">
                {domainTitle && <span className="font-medium">{domainTitle}</span>}
                {domainTitle && moduleTitle && <span>•</span>}
                {moduleTitle && <span className="font-medium">{moduleTitle}</span>}
              </div>
            )}
            <h1 className="text-xl font-semibold leading-tight text-neutral-900">{caseStudy.title}</h1>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span className="font-medium">{caseStudy.company}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span className="font-medium">{caseStudy.industry}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-medium">{caseStudy.timeframe}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-neutral-500 font-medium">
              {caseStudy.difficulty}
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              {caseStudy.estimatedReadTime} MIN
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-neutral-200 rounded-none">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide"
          >
            OVERVIEW
          </TabsTrigger>
          <TabsTrigger 
            value="analysis"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide"
          >
            ANALYSIS
          </TabsTrigger>
          <TabsTrigger 
            value="results"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide"
          >
            RESULTS
          </TabsTrigger>
          <TabsTrigger 
            value="lessons"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 text-xs font-medium text-neutral-600 data-[state=active]:text-neutral-900 uppercase tracking-wide"
          >
            LESSONS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Situation & Challenge */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-neutral-50 border border-neutral-200 rounded-lg">
              <CardHeader className="p-3">
                <CardTitle className="text-base font-semibold leading-tight text-neutral-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-neutral-600" />
                  The Situation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <MarkdownRenderer content={caseStudy.situation} />
              </CardContent>
            </Card>

            <Card className="bg-neutral-50 border border-neutral-200 rounded-lg">
              <CardHeader className="p-3">
                <CardTitle className="text-base font-semibold leading-tight text-neutral-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-neutral-600" />
                  The Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <MarkdownRenderer content={caseStudy.challenge} />
              </CardContent>
            </Card>
          </div>

          {/* Actions Taken */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Actions Taken
              </CardTitle>
              <CardDescription>
                Key strategic decisions and implementation steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {caseStudy.actions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <MarkdownRenderer content={action} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Analysis</CardTitle>
              <CardDescription>
                Deep dive into the decision-making process and strategic considerations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Decision Framework */}
              <div>
                <h4 className="font-semibold mb-3">Decision Framework Applied</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    This case study demonstrates the practical application of key frameworks from this module:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {caseStudy.relatedConcepts.map((concept, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">{concept}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alternative Approaches */}
              <div>
                <h4 className="font-semibold mb-3">Alternative Approaches Considered</h4>
                <div className="space-y-3">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-2">Option A: Status Quo</h5>
                    <p className="text-sm text-gray-600">Continue with existing strategy and incremental improvements.</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-xs">Low Risk</Badge>
                      <Badge variant="outline" className="text-xs">Low Reward</Badge>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-2">Option B: Aggressive Expansion</h5>
                    <p className="text-sm text-gray-600">Rapid market expansion through acquisitions and partnerships.</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-xs">High Risk</Badge>
                      <Badge variant="outline" className="text-xs">High Reward</Badge>
                    </div>
                  </div>
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h5 className="font-medium text-sm mb-2">Option C: Chosen Strategy ✓</h5>
                    <p className="text-sm text-gray-600">Balanced approach focusing on core strengths while exploring new opportunities.</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-xs">Medium Risk</Badge>
                      <Badge variant="outline" className="text-xs">High Reward</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6 mt-6">
          {/* Results Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Quantitative Results
              </CardTitle>
              <CardDescription>
                Measurable outcomes and performance improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseStudy.results.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">{result.metric}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Before:</span>
                        <span className="font-medium">{result.before}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">After:</span>
                        <span className="font-medium">{result.after}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
                        <span className="text-gray-500">Improvement:</span>
                        <span className="font-semibold text-green-600">{result.improvement}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Implementation Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">Q1</span>
                  </div>
                  <div>
                    <div className="font-medium">Planning & Analysis</div>
                    <div className="text-sm text-gray-600">Strategic assessment and framework development</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-orange-600">Q2</span>
                  </div>
                  <div>
                    <div className="font-medium">Implementation</div>
                    <div className="text-sm text-gray-600">Execution of key strategic initiatives</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">Q3</span>
                  </div>
                  <div>
                    <div className="font-medium">Results & Optimization</div>
                    <div className="text-sm text-gray-600">Measuring outcomes and fine-tuning approach</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-6 mt-6">
          {/* Key Lessons */}
          <Card>
            <CardHeader>
              <CardTitle>Key Lessons Learned</CardTitle>
              <CardDescription>
                Critical insights and learnings from this case study
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {caseStudy.lessons.map((lesson, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <MarkdownRenderer content={lesson} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Takeaways */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Takeaways</CardTitle>
              <CardDescription>
                Actionable insights for senior leadership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseStudy.keyTakeaways.map((takeaway, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{takeaway}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Exercise */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">Apply This to Your Business</CardTitle>
              <CardDescription className="text-purple-700">
                Reflection questions to help you apply these insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="font-medium text-sm text-purple-900 mb-1">Reflection Question 1:</div>
                  <div className="text-sm text-purple-700">
                    How might the strategic framework used in this case apply to your current business challenges?
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="font-medium text-sm text-purple-900 mb-1">Reflection Question 2:</div>
                  <div className="text-sm text-purple-700">
                    What similar metrics could you track to measure the success of your strategic initiatives?
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="font-medium text-sm text-purple-900 mb-1">Action Item:</div>
                  <div className="text-sm text-purple-700">
                    Identify one key lesson from this case that you can implement in your organization within the next 30 days.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      {(onPrevious || onNext) && (
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <div>
            {onPrevious && (
              <Button variant="outline" onClick={onPrevious}>
                ← Previous Case Study
              </Button>
            )}
          </div>
          <div>
            {onNext && (
              <Button onClick={onNext}>
                Next Case Study →
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
