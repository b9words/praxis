'use client'

import { useMemo } from 'react'
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import DataSheetRenderer from './DataSheetRenderer'

interface DataChartRendererProps {
  content: string
}

export default function DataChartRenderer({ content }: DataChartRendererProps) {
  const { chartData, title, summary, keyTakeaways } = useMemo(() => {
    // Parse JSON content
    let parsed: any = null
    try {
      parsed = JSON.parse(content.trim())
    } catch (e) {
      console.warn('[DataChartRenderer] JSON parse failed:', e)
      return { chartData: [], title: null, summary: null, keyTakeaways: null }
    }

    // Extract metadata
    const title = parsed.title || null
    const summary = parsed.summary || null
    const keyTakeaways = parsed.keyTakeaways || null

    // Extract chart data
    let dataArray: any[] = []
    if (Array.isArray(parsed)) {
      dataArray = parsed
    } else if (Array.isArray(parsed.data)) {
      dataArray = parsed.data
    } else if (Array.isArray(parsed.values)) {
      dataArray = parsed.values
    } else if (Array.isArray(parsed.series)) {
      dataArray = parsed.series
    }

    return { chartData: dataArray, title, summary, keyTakeaways }
  }, [content])

  if (chartData.length === 0) {
    // Fallback: Try to render as DataSheet if we can't find chart data
    return (
      <div className="space-y-2">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <p className="font-semibold mb-1">Unable to parse as chart data</p>
          <p className="text-xs">Expected an array of data points with time/value properties. Showing as data sheet instead.</p>
        </div>
        <DataSheetRenderer data={content} />
      </div>
    )
  }

  // Find the time/date key
  const timeKey = Object.keys(chartData[0]).find(key => 
    ['date', 'period', 'month', 'quarter', 'year', 'time', 'timestamp'].includes(key.toLowerCase())
  ) || 'period'

  // Find all numeric value keys
  const valueKeys = Object.keys(chartData[0]).filter(key => 
    key !== timeKey &&
    typeof chartData[0][key] === 'number'
  )

  if (valueKeys.length === 0) {
    // Fallback: Render as DataSheet if no numeric values found
    return (
      <div className="space-y-2">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          <p className="font-semibold mb-1">No numeric values found for chart</p>
          <p className="text-xs">Expected data points with numeric properties. Showing as data sheet instead.</p>
        </div>
        <DataSheetRenderer data={content} />
      </div>
    )
  }

  // Determine chart type: use line for single series, bar for multiple
  const useBarChart = valueKeys.length > 1

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">{title || 'Market Data Analysis'}</h3>
      </div>
      {summary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-900 leading-relaxed">{summary}</p>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title ? 'Data Visualization' : 'Performance Metrics'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {useBarChart ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey={timeKey} 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                {valueKeys.map((key, idx) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    fill={colors[idx % colors.length]}
                    name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey={timeKey} 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={valueKeys[0]} 
                  stroke={colors[0]} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name={valueKeys[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {keyTakeaways && Array.isArray(keyTakeaways) && keyTakeaways.length > 0 && (
        <Card className="mt-4 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-base">Key Takeaways</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keyTakeaways.map((takeaway: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
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

