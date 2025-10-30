'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useCaseStudyStore } from '@/lib/case-study-store'
import { CheckCircle, Mic, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import CaseDataViewer from '../CaseDataViewer'

interface AnalystQuestion {
  persona: string
  question: string
}

interface EarningsCallQALayoutProps {
  challengeData: {
    prompt?: string
    analystQuestions?: AnalystQuestion[]
    [key: string]: any
  }
}

export default function EarningsCallQALayout({ challengeData }: EarningsCallQALayoutProps) {
  const { currentStageId, getStageState, updateStageState, submitStageData, caseStudyData } = useCaseStudyStore()
  const { prompt, analystQuestions = [] } = challengeData
  
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)

  // Get case file IDs for reference
  const caseFileIds = caseStudyData?.caseFiles.map(file => file.fileId) || []

  // Load existing responses
  useEffect(() => {
    if (currentStageId) {
      const stageState = getStageState(currentStageId)
      const existingResponses = stageState.userSubmissions.responses || {}
      setResponses(existingResponses)
    }
  }, [currentStageId, getStageState])

  // Auto-save responses
  useEffect(() => {
    if (currentStageId && Object.keys(responses).length > 0) {
      const stageState = getStageState(currentStageId)
      updateStageState(currentStageId, {
        userSubmissions: {
          ...stageState.userSubmissions,
          responses
        }
      })
    }
  }, [responses, currentStageId, getStageState, updateStageState])

  const handleResponseChange = (questionIndex: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionIndex]: value
    }))
  }

  const handleSubmitAll = () => {
    if (!currentStageId) return
    
    const allResponses = analystQuestions.map((_, index) => ({
      question: analystQuestions[index],
      response: responses[index] || ''
    }))

    submitStageData(currentStageId, {
      responses,
      fullResponses: allResponses
    })
  }

  const getCompletionStatus = () => {
    const answered = Object.keys(responses).filter(key => responses[parseInt(key)]?.trim()).length
    return `${answered}/${analystQuestions.length}`
  }

  const isComplete = () => {
    return analystQuestions.every((_, index) => responses[index]?.trim())
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Case Materials Reference */}
      <div className="lg:col-span-1">
        <CaseDataViewer fileIds={caseFileIds} />
      </div>

      {/* Right Column: Q&A Interface */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Mic className="h-5 w-5" />
              Earnings Call Q&A Session
            </CardTitle>
            <CardDescription className="text-blue-700">
              {prompt || 'Respond to analyst questions following your strategic announcement. Your answers must be consistent with your chosen path and address investor concerns directly.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">
                Questions answered: {getCompletionStatus()}
              </span>
              <span className="text-blue-600 font-medium flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Live Q&A Session
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Question Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {analystQuestions.map((_, index) => (
            <Button
              key={index}
              variant={currentQuestion === index ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentQuestion(index)}
              className={`flex-shrink-0 ${
                responses[index]?.trim() ? 'border-green-500 bg-green-50 text-green-700' : ''
              }`}
            >
              Q{index + 1}
              {responses[index]?.trim() && (
                <CheckCircle className="ml-1 h-3 w-3 text-green-600" />
              )}
            </Button>
          ))}
        </div>

        {/* Current Question */}
        {analystQuestions[currentQuestion] && (
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-neutral-100 rounded-full">
                  <User className="h-4 w-4 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-neutral-900">
                    {analystQuestions[currentQuestion].persona}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed mt-2">
                    "{analystQuestions[currentQuestion].question}"
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Your Response:
                </label>
                <Textarea
                  value={responses[currentQuestion] || ''}
                  onChange={(e) => handleResponseChange(currentQuestion, e.target.value)}
                  placeholder="Provide a clear, confident response that addresses the analyst's concerns while staying consistent with your strategic choice. Reference specific data points from the case materials to support your position..."
                  className="min-h-[150px] resize-y"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  Words: {responses[currentQuestion]?.trim().split(/\s+/).length || 0}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQuestion(Math.min(analystQuestions.length - 1, currentQuestion + 1))}
                    disabled={currentQuestion === analystQuestions.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Section */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">
                  Complete Q&A Session
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {isComplete() 
                    ? 'All questions answered. Ready to submit your responses.'
                    : `Answer all ${analystQuestions.length} questions to complete this stage.`
                  }
                </p>
              </div>
              
              <Button
                onClick={handleSubmitAll}
                disabled={!isComplete()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Submit All Responses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}