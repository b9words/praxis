'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCaseFile } from '@/hooks/useCaseFile'
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, Cell, Line, Pie, LineChart as RechartsLineChart, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface DataVisualizationBlockProps {
  blockId: string
  title?: string
  fileId: string
  chartTypes?: ('bar' | 'line' | 'pie')[]
  defaultChartType?: 'bar' | 'line' | 'pie'
  xAxisKey?: string
  yAxisKey?: string
  colorScheme?: string[]
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
]

export default function DataVisualizationBlock({
  blockId,
  title = 'Data Visualization',
  fileId,
  chartTypes = ['bar', 'line', 'pie'],
  defaultChartType = 'bar',
  xAxisKey,
  yAxisKey,
  colorScheme = DEFAULT_COLORS
}: DataVisualizationBlockProps) {
  const fileData = useCaseFile(fileId)
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>(defaultChartType)
  const [selectedXAxis, setSelectedXAxis] = useState<string>(xAxisKey || '')
  const [selectedYAxis, setSelectedYAxis] = useState<string>(yAxisKey || '')

  if (fileData.isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading chart data...</p>
        </CardContent>
      </Card>
    )
  }

  if (fileData.error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Error loading data: {fileData.error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!Array.isArray(fileData.content) || fileData.content.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-neutral-600">No data available for visualization</p>
        </CardContent>
      </Card>
    )
  }

  const data = fileData.content as any[]
  const availableKeys = Object.keys(data[0] || {})
  const numericKeys = availableKeys.filter(key => {
    const value = data[0][key]
    return !isNaN(parseFloat(value)) && isFinite(value)
  })

  // Auto-select axes if not specified
  const xAxis = selectedXAxis || availableKeys[0] || ''
  const yAxis = selectedYAxis || numericKeys[0] || ''

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-4 w-4" />
      case 'line':
        return <LineChart className="h-4 w-4" />
      case 'pie':
        return <PieChart className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  const renderChart = () => {
    const chartData = data.map(item => ({
      ...item,
      [yAxis]: parseFloat(item[yAxis]) || 0
    }))

    switch (selectedChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey={xAxis} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `${xAxis}: ${label}`}
              />
              <Bar dataKey={yAxis} fill={colorScheme[0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey={xAxis} 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `${xAxis}: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey={yAxis} 
                stroke={colorScheme[0]} 
                strokeWidth={2}
                dot={{ fill: colorScheme[0], strokeWidth: 2, r: 4 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case 'pie':
        const pieData = chartData.slice(0, 10).map((item, index) => ({
          name: item[xAxis],
          value: item[yAxis],
          fill: colorScheme[index % colorScheme.length]
        }))

        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center text-neutral-500">Unsupported chart type</div>
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
        <CardDescription>
          Visualizing data from {fileData.fileName} • {data.length} data points
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Chart Controls */}
        <div className="flex flex-wrap gap-4">
          {chartTypes.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-700">Chart Type:</label>
              <Select value={selectedChartType} onValueChange={(value: 'bar' | 'line' | 'pie') => setSelectedChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getChartIcon(type)}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-700">X-Axis:</label>
            <Select value={xAxis} onValueChange={setSelectedXAxis}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableKeys.map(key => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-700">Y-Axis:</label>
            <Select value={yAxis} onValueChange={setSelectedYAxis}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {numericKeys.map(key => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart */}
        <div className="border rounded-lg p-4 bg-white">
          {renderChart()}
        </div>

        {/* Data Summary */}
        <div className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded">
          <strong>Data Insights:</strong> This visualization helps you identify patterns, trends, and outliers in the case data. 
          Use different chart types to explore various perspectives on the same dataset.
        </div>
      </CardContent>
    </Card>
  )
}
