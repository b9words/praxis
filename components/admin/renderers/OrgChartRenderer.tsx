'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users } from 'lucide-react'
import DataSheetRenderer from './DataSheetRenderer'

interface OrgNode {
  name: string
  title?: string
  department?: string
  role?: string
  reportsTo?: string
  children?: OrgNode[]
  [key: string]: any
}

interface OrgChartRendererProps {
  content: string
}

export default function OrgChartRenderer({ content }: OrgChartRendererProps) {
  const { parsedData, title, summary, keyTakeaways } = useMemo(() => {
    // Parse JSON content
    let parsed: any = null
    try {
      parsed = JSON.parse(content.trim())
    } catch (e) {
      console.warn('[OrgChartRenderer] JSON parse failed:', e)
      return { parsedData: null, title: null, summary: null, keyTakeaways: null }
    }

    // Extract metadata
    const title = parsed.title || null
    const summary = parsed.summary || null
    const keyTakeaways = parsed.keyTakeaways || null

    // Extract org data
    let orgData: any[] = []
    if (Array.isArray(parsed)) {
      orgData = parsed
    } else if (parsed.organization && Array.isArray(parsed.organization)) {
      orgData = parsed.organization
    } else if (Array.isArray(parsed.root || parsed.topLevel || parsed.ceo)) {
      orgData = parsed.root || parsed.topLevel || parsed.ceo
    } else if (parsed.root || parsed.topLevel || parsed.ceo) {
      orgData = [parsed.root || parsed.topLevel || parsed.ceo]
    } else if (Array.isArray(parsed.employees || parsed.departments)) {
      orgData = parsed.employees || parsed.departments
    } else if (typeof parsed === 'object' && !parsed.title && !parsed.summary) {
      // Single object - wrap in array
      orgData = [parsed]
    }

    return { parsedData: orgData, title, summary, keyTakeaways }
  }, [content])

  const orgData = parsedData

  if (orgData.length === 0) {
    // Fallback: Render as DataSheet if we can't parse as org chart
    return (
      <div className="space-y-2">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <p className="font-semibold mb-1">Unable to parse as organizational structure</p>
          <p className="text-xs">Expected an array of employee/department objects. Showing as data sheet instead.</p>
        </div>
        <DataSheetRenderer data={content} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">{title || 'Organizational Structure'}</h3>
      </div>
      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900 leading-relaxed">{summary}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgData.map((node: OrgNode, idx: number) => (
          <Card key={idx} className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate">{node.name}</CardTitle>
                  {node.title && (
                    <p className="text-sm text-gray-600 mt-1">{node.title}</p>
                  )}
                  {node.role && node.role !== node.title && (
                    <p className="text-xs text-gray-500 mt-0.5">{node.role}</p>
                  )}
                </div>
              </div>
              {node.department && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {node.department}
                </Badge>
              )}
            </CardHeader>
            {node.children && Array.isArray(node.children) && node.children.length > 0 && (
              <CardContent className="pt-0">
                <div className="border-t pt-3 mt-2">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Direct Reports:</p>
                  <ul className="space-y-1.5">
                    {node.children.slice(0, 5).map((child, childIdx) => (
                      <li key={childIdx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="flex-1">
                          <span className="font-medium">{child.name}</span>
                          {child.title && (
                            <span className="text-gray-500 text-xs ml-1">({child.title})</span>
                          )}
                        </span>
                      </li>
                    ))}
                    {node.children.length > 5 && (
                      <li className="text-xs text-gray-500 italic">
                        ... and {node.children.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            )}
            {node.reportsTo && (
              <CardContent className="pt-0">
                <div className="border-t pt-3 mt-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Reports To:</p>
                  <p className="text-sm text-gray-600">{node.reportsTo}</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      {keyTakeaways && Array.isArray(keyTakeaways) && keyTakeaways.length > 0 && (
        <Card className="mt-4 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-base">Key Takeaways</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyTakeaways.map((takeaway: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
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

