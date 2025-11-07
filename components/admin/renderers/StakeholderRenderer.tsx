'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, AlertTriangle, Target } from 'lucide-react'
import DataSheetRenderer from './DataSheetRenderer'

interface StakeholderProfile {
  name: string
  title?: string
  role?: string
  department?: string
  concerns?: string[]
  motivations?: string[]
  influence?: string
  priorities?: string[]
  [key: string]: any
}

interface StakeholderRendererProps {
  content: string
}

export default function StakeholderRenderer({ content }: StakeholderRendererProps) {
  const { stakeholders, title, summary, keyTakeaways } = useMemo(() => {
    // Parse JSON content
    let parsed: any = null
    let contentToParse = content.trim()
    
    try {
      parsed = JSON.parse(contentToParse)
    } catch (e) {
      // Retry: try to extract JSON from code fences
      try {
        const codeFenceMatch = contentToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (codeFenceMatch) {
          contentToParse = codeFenceMatch[1].trim()
          parsed = JSON.parse(contentToParse)
        } else {
          // Retry: try to extract from quoted JSON string
          const quotedMatch = contentToParse.match(/^["']([\s\S]*?)["']$/)
          if (quotedMatch) {
            contentToParse = quotedMatch[1].replace(/\\"/g, '"').replace(/\\'/g, "'")
            parsed = JSON.parse(contentToParse)
          } else {
            throw e // Re-throw original error
          }
        }
      } catch (retryError) {
        console.warn('[StakeholderRenderer] JSON parse failed after retries:', retryError)
        return { stakeholders: [], title: null, summary: null, keyTakeaways: null }
      }
    }

    // Extract metadata
    const title = parsed.title || null
    const summary = parsed.summary || null
    const keyTakeaways = parsed.keyTakeaways || null

    // Extract stakeholders
    let stakeholdersList: any[] = []
    if (Array.isArray(parsed)) {
      stakeholdersList = parsed
    } else if (Array.isArray(parsed.stakeholders)) {
      stakeholdersList = parsed.stakeholders
    } else if (Array.isArray(parsed.profiles)) {
      stakeholdersList = parsed.profiles
    } else if (typeof parsed === 'object' && !parsed.title && !parsed.summary) {
      // Single object - wrap in array
      stakeholdersList = [parsed]
    }

    return { stakeholders: stakeholdersList, title, summary, keyTakeaways }
  }, [content])

  if (stakeholders.length === 0) {
    // Fallback: Render as DataSheet if we can't parse as stakeholder profiles
    return (
      <div className="space-y-2">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <p className="font-semibold mb-1">Unable to parse as stakeholder profiles</p>
          <p className="text-xs">Expected an array of stakeholder objects. Showing as data sheet instead.</p>
        </div>
        <DataSheetRenderer data={content} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">{title || 'Stakeholder Profiles'}</h3>
      </div>
      {summary && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-purple-900 leading-relaxed">{summary}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stakeholders.map((stakeholder: StakeholderProfile, idx: number) => (
          <Card key={idx} className="border-l-4 border-l-purple-500 shadow-sm">
            <CardHeader>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">{stakeholder.name}</CardTitle>
                  {(stakeholder.title || stakeholder.role) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {stakeholder.title || stakeholder.role}
                    </p>
                  )}
                </div>
              </div>
              {stakeholder.department && (
                <Badge variant="outline" className="mt-2">
                  {stakeholder.department}
                </Badge>
              )}
              {stakeholder.influence && (
                <Badge variant="secondary" className="mt-2 ml-2">
                  Influence: {stakeholder.influence}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {stakeholder.concerns && Array.isArray(stakeholder.concerns) && stakeholder.concerns.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <p className="text-xs font-semibold text-gray-700">Key Concerns:</p>
                  </div>
                  <ul className="space-y-1">
                    {stakeholder.concerns.map((concern: string, cIdx: number) => (
                      <li key={cIdx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span className="flex-1">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {stakeholder.motivations && Array.isArray(stakeholder.motivations) && stakeholder.motivations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-semibold text-gray-700">Motivations:</p>
                  </div>
                  <ul className="space-y-1">
                    {stakeholder.motivations.map((motivation: string, mIdx: number) => (
                      <li key={mIdx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="flex-1">{motivation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {stakeholder.priorities && Array.isArray(stakeholder.priorities) && stakeholder.priorities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Priorities:</p>
                  <div className="flex flex-wrap gap-1">
                    {stakeholder.priorities.map((priority: string, pIdx: number) => (
                      <Badge key={pIdx} variant="outline" className="text-xs">
                        {priority}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {keyTakeaways && Array.isArray(keyTakeaways) && keyTakeaways.length > 0 && (
        <Card className="mt-4 border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-base">Key Takeaways</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyTakeaways.map((takeaway: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-purple-500 mt-1">•</span>
                  <span className="flex-1">{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

