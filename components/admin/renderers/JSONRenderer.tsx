'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, Building2, TrendingUp } from 'lucide-react'

interface JSONRendererProps {
  content: string
  fileType: string
  fileName: string
}

interface OrgNode {
  name: string
  title?: string
  department?: string
  children?: OrgNode[]
}

interface StakeholderProfile {
  name: string
  title?: string
  role?: string
  department?: string
  concerns?: string[]
  motivations?: string[]
  [key: string]: any
}

interface TimeSeriesData {
  date?: string
  period?: string
  value?: number
  [key: string]: any
}

export default function JSONRenderer({ content, fileType, fileName }: JSONRendererProps) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(content)
    } catch {
      return null
    }
  }, [content])

  if (!parsed) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        Invalid JSON format
      </div>
    )
  }

  // Detect JSON structure and render accordingly
  const isOrgChart = fileType === 'ORG_CHART' || 
    fileName.toLowerCase().includes('org') || 
    fileName.toLowerCase().includes('organizational') ||
    (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && ('children' in parsed[0] || 'reportsTo' in parsed[0]))

  const isStakeholderProfiles = fileType === 'STAKEHOLDER_PROFILES' ||
    fileName.toLowerCase().includes('stakeholder') ||
    (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && ('concerns' in parsed[0] || 'motivations' in parsed[0]))

  const isTimeSeriesData = Array.isArray(parsed) && parsed.length > 0 && 
    typeof parsed[0] === 'object' && 
    ('date' in parsed[0] || 'period' in parsed[0] || 'month' in parsed[0] || 'quarter' in parsed[0]) &&
    ('value' in parsed[0] || 'revenue' in parsed[0] || 'sales' in parsed[0] || 'growth' in parsed[0])

  // Render Org Chart
  if (isOrgChart) {
    const orgData = Array.isArray(parsed) ? parsed : [parsed]
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Organizational Structure</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgData.map((node: OrgNode, idx: number) => (
            <Card key={idx} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{node.name}</CardTitle>
                {node.title && (
                  <p className="text-sm text-gray-600 mt-1">{node.title}</p>
                )}
                {node.department && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {node.department}
                  </Badge>
                )}
              </CardHeader>
              {node.children && node.children.length > 0 && (
                <CardContent>
                  <p className="text-xs text-gray-500 mb-2">Direct Reports:</p>
                  <ul className="space-y-1">
                    {node.children.map((child, childIdx) => (
                      <li key={childIdx} className="text-sm text-gray-700">
                        • {child.name}
                        {child.title && <span className="text-gray-500 ml-1">({child.title})</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Render Stakeholder Profiles
  if (isStakeholderProfiles) {
    const stakeholders = Array.isArray(parsed) ? parsed : [parsed]
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Stakeholder Profiles</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stakeholders.map((stakeholder: StakeholderProfile, idx: number) => (
            <Card key={idx} className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg">{stakeholder.name}</CardTitle>
                {(stakeholder.title || stakeholder.role) && (
                  <p className="text-sm text-gray-600 mt-1">
                    {stakeholder.title || stakeholder.role}
                  </p>
                )}
                {stakeholder.department && (
                  <Badge variant="outline" className="mt-2">
                    {stakeholder.department}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {stakeholder.concerns && stakeholder.concerns.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Key Concerns:</p>
                    <ul className="space-y-1">
                      {stakeholder.concerns.map((concern: string, cIdx: number) => (
                        <li key={cIdx} className="text-sm text-gray-600">• {concern}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {stakeholder.motivations && stakeholder.motivations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Motivations:</p>
                    <ul className="space-y-1">
                      {stakeholder.motivations.map((motivation: string, mIdx: number) => (
                        <li key={mIdx} className="text-sm text-gray-600">• {motivation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Render Time Series / Market Data
  if (isTimeSeriesData) {
    const data = parsed as TimeSeriesData[]
    const dataKeys = Object.keys(data[0]).filter(key => 
      key !== 'date' && key !== 'period' && key !== 'month' && key !== 'quarter' &&
      typeof data[0][key] === 'number'
    )
    const timeKey = Object.keys(data[0]).find(key => 
      ['date', 'period', 'month', 'quarter', 'year'].includes(key)
    ) || 'period'

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Market Data Analysis</h3>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <ResponsiveContainer width="100%" height={400}>
            {dataKeys.length === 1 ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={timeKey} 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={dataKeys[0]} 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={timeKey} 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {dataKeys.map((key, idx) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx % 4]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // Generic JSON: Collapsible tree view
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <JSONTreeView data={parsed} />
    </div>
  )
}

// Simple JSON tree viewer component
function JSONTreeView({ data, depth = 0 }: { data: any; depth?: number }) {
  if (depth > 10) {
    return <span className="text-gray-500 text-sm">[Too deep]</span>
  }

  if (data === null) {
    return <span className="text-gray-500">null</span>
  }

  if (typeof data === 'string') {
    return <span className="text-green-700">"{data}"</span>
  }

  if (typeof data === 'number') {
    return <span className="text-blue-700">{data}</span>
  }

  if (typeof data === 'boolean') {
    return <span className="text-purple-700">{String(data)}</span>
  }

  if (Array.isArray(data)) {
    return (
      <div className="ml-4">
        <span className="text-gray-600">[</span>
        <div className="ml-4 space-y-1">
          {data.slice(0, 10).map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-gray-400 text-xs">{idx}:</span>
              <JSONTreeView data={item} depth={depth + 1} />
            </div>
          ))}
          {data.length > 10 && (
            <span className="text-gray-400 text-sm">... and {data.length - 10} more</span>
          )}
        </div>
        <span className="text-gray-600">]</span>
      </div>
    )
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data)
    return (
      <div className="ml-4">
        <span className="text-gray-600">{'{'}</span>
        <div className="ml-4 space-y-1">
          {keys.slice(0, 20).map((key) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-blue-600 font-medium">"{key}":</span>
              <JSONTreeView data={data[key]} depth={depth + 1} />
            </div>
          ))}
          {keys.length > 20 && (
            <span className="text-gray-400 text-sm">... and {keys.length - 20} more properties</span>
          )}
        </div>
        <span className="text-gray-600">{'}'}</span>
      </div>
    )
  }

  return <span className="text-gray-500">{String(data)}</span>
}


