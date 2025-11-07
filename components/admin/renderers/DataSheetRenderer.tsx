'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface DataSheetRendererProps {
  data: any
}

export default function DataSheetRenderer({ data }: DataSheetRendererProps) {
  const parsedData = useMemo(() => {
    // Helper function to parse CSV
    const parseCSV = (csvString: string) => {
      const lines = csvString.trim().split('\n').filter(l => l.trim())
      if (lines.length === 0) {
        return null
      }
      
      // Parse CSV header and rows
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          const nextChar = line[i + 1]
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"'
              i++
            } else {
              inQuotes = !inQuotes
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result
      }
      
      const headers = parseCSVLine(lines[0])
      const rows = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        const row: any = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx] || ''
        })
        return row
      })
      
      return rows
    }
    
    // Handle string data - could be CSV or JSON
    let parsed: any = null
    
    if (typeof data === 'string') {
      // Check if it's CSV (has commas and newlines)
      if (data.includes(',') && data.split('\n').length > 1) {
        const rows = parseCSV(data)
        if (rows) {
          parsed = { data: rows }
        } else {
          return null
        }
      } else {
        // Try to parse as JSON
        try {
          parsed = JSON.parse(data)
        } catch {
          return null
        }
      }
    } else if (data && typeof data === 'object') {
      // Check if data.data is a CSV string
      if (data.data && typeof data.data === 'string' && data.data.includes(',') && data.data.split('\n').length > 1) {
        // Parse the CSV string in data.data
        const rows = parseCSV(data.data)
        if (rows) {
          // Combine metadata with parsed CSV rows
          parsed = {
            ...data,
            data: rows,
          }
        } else {
          return null
        }
      } else {
        // It's already an object, use it as-is
        parsed = data
      }
    } else {
      return null
    }

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    // Extract metadata (from the data object itself, which may have been combined with metadata)
    const title = parsed.name || parsed.title || 'Data Sheet'
    const description = parsed.description || null
    const units = parsed.units || {}

    // Extract the actual data array from the parsed object
    const tableData = parsed.data || parsed.rows || (Array.isArray(parsed) ? parsed : null)

    if (!Array.isArray(tableData) || tableData.length === 0) {
      return null
    }

    // Get headers from the first row
    const firstRow = tableData[0]
    if (!firstRow || typeof firstRow !== 'object') {
      return null
    }

    const headers = Object.keys(firstRow)
    if (headers.length === 0) {
      return null
    }

    return {
      title,
      description,
      units,
      headers,
      rows: tableData,
    }
  }, [data])

  if (!parsedData) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-yellow-900 mb-1">Unable to Parse Data</p>
            <p className="text-sm text-yellow-700">
              The data format is not recognized. Expected a JSON object with a 'data' array containing rows.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Format cell values with units if available
  const formatCellValue = (header: string, value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '—'
    }
    
    // Try to parse as number if it's a string
    let numValue: number | null = null
    if (typeof value === 'string') {
      // Remove commas and try to parse
      const cleaned = value.replace(/,/g, '').trim()
      const parsed = parseFloat(cleaned)
      if (!isNaN(parsed) && cleaned !== '') {
        numValue = parsed
      }
    } else if (typeof value === 'number') {
      numValue = value
    }
    
    const unit = parsedData.units[header]
    if (unit && numValue !== null) {
      // Format numbers with appropriate units
      if (unit.includes('Percentage') || unit.includes('%')) {
        return `${numValue}%`
      }
      if (unit.includes('USD') || unit.includes('EUR')) {
        // Format currency
        const currency = unit.includes('EUR') ? 'EUR' : 'USD'
        const isMillions = unit.includes('Millions')
        let formattedValue: string
        if (isMillions) {
          formattedValue = (numValue / 1000000).toFixed(2)
        } else {
          formattedValue = numValue.toLocaleString('en-US', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 
          })
        }
        return `${currency} ${formattedValue}${isMillions ? 'M' : ''}`
      }
    }
    
    return String(value)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{parsedData.title}</CardTitle>
          {parsedData.description && (
            <CardDescription className="text-sm text-gray-600 mt-2">
              {parsedData.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{parsedData.rows.length} rows</span>
              {Object.keys(parsedData.units).length > 0 && (
                <span className="text-xs">
                  {Object.entries(parsedData.units).map(([key, unit]) => (
                    <span key={key} className="ml-3">
                      <span className="font-medium">{key}:</span> {String(unit)}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <div className="overflow-x-auto border rounded-lg max-h-[60vh] overflow-y-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {parsedData.headers.map((header) => (
                      <th
                        key={header}
                        className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900 whitespace-nowrap"
                      >
                        {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.rows.map((row: any, rowIdx: number) => (
                    <tr
                      key={rowIdx}
                      className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      {parsedData.headers.map((header) => (
                        <td
                          key={header}
                          className="border border-gray-300 px-4 py-2 text-gray-800"
                        >
                          {formatCellValue(header, row[header])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
